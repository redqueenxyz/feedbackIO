// This script handles recieved payloads, which is what we get whenever anyone answers a survey question (A QR) 

// Export
var survey_handler = module.exports = {};

// Package Dependencies
var database = require('../services/database_handler')
var logger = require('winston')

// Local Dependencies
var object_sender = require('../routes/object_sender')

/**Saves new users in Firebase */
survey_handler.saveUser = function (userID, firstName) {
  logger.info("Saving User %d in the Database...", userID);
  database.db.ref('users/' + userID).set({
    "firstName": firstName,
    "availableSurveys": {},
    "currentSurvey": {}
  });
};


/** Checking if the user exists in the database */
survey_handler.userFinder = function (userID) {
  logger.info("Checking if we've met User %d before...", userID);

  // Check if the userID exists
  database.db.ref('users/' + userID).once('value', function (snapshot) {
    var userExists = snapshot.exists();

    if (userExists) {

      logger.info("We've met User %d before!", userID)
      survey_handler.surveyChecker(userID)


      // FIXME: Quick test of surveyAssigner loop; can assign any surveys in the UserFinder
      // survey_handler.surveyAssigner(userID, "survey_1")

    } else {
      logger.info("Have not met this user!", userID)
      survey_handler.saveUser(userID, "firstNameHolder")

      logger.info("Sending User %d the Starting prompt message...", userID)
      object_sender.sendTextMessage(userID, "Welcome to the FeedbackAI Beta! What's your name?");


      // FIXME: This means the user has to message us again to start the first survey; better chaining? 
      logger.info("Assigning User %d the starter survey: [survey_0]...", userID)
      survey_handler.surveyAssigner(userID, "survey_0", true)


    }
  });
};

/** Assigns a user an available survey */
survey_handler.surveyAssigner = function (userID, surveyID, current = false) {

  logger.info("Assiging User %d Survey %s...", userID, surveyID)

  // Lookup the survey
  database.db.ref('surveys/' + surveyID).once("value", function (survey) {
    var totalQuestions = survey.child("/questions/").numChildren(); // Array indices start at 0

    // Register it as an available survey for the user
    database.db.ref('users/' + userID + '/availableSurveys/' + surveyID).set({
      "postback": surveyID,
      "completed": false,
      "started": false,
      "current": current,
      "totalQuestions": totalQuestions
    });

  })
};

/** Starts user on a survey if he has a Current Survey, or sets him on one from Available if none exist */
survey_handler.surveyChecker = function (userID) {
  logger.info("Checking if User %d has any available surveys...", userID)

  // If he has a current Survey that's not intialized, set it up and send him into the Looper
  database.db.ref('users/' + userID + '/availableSurveys').orderByChild("current").equalTo(true).once('value').then(
    // Promise is accepted
    function (snapshot) {
      // Get the current Survey key
      var currentSurvey = snapshot.val()
      var currentSurveyKey = Object.keys(currentSurvey)[0]

      // Get the current Survey state
      var startedCurrentSurvey = snapshot.child(currentSurveyKey).child("started").val();
      var completedCurrentSurvey = snapshot.child(currentSurveyKey).child("completed").val();

      if (currentSurvey && !startedCurrentSurvey) {
        // This means the survey was assigned as active, but not started (usually survey_0)
        logger.info("User %d has an \"active\" survey: %s! Setting it as the current survey...", userID, currentSurveyKey)

        // Initialize the current Survey State state
        database.db.ref('users/' + userID + '/currentSurvey/' + currentSurveyKey).set({
          "finalQuestion": snapshot.child(currentSurveyKey + "/totalQuestions").val() - 1,
          "currentQuestion": 0
        }).then(
          function (data) {
            // After that state is updated, now start the user on that Survey
            survey_handler.surveyLooper(userID, currentSurveyKey)

            // Update that survey state to started.
            logger.info("Setting User %d's Survey %s to \"started\" state...", userID, currentSurveyKey)
            database.db.ref('users/' + userID + '/availableSurveys/' + currentSurveyKey).update({ "started": true });

          });

      } else if (currentSurvey && startedCurrentSurvey) {
        // This means he's already in a survey, and needs to continue looping      
        logger.info("User %d is currently on Survey %s! Handing off to looper...", userID, currentSurveyKey)
        survey_handler.surveyLooper(userID, currentSurveyKey)

      } else if (!currentSurvey) {
        // If he has no current surveys, let's assign him one 
        database.db.ref('users/' + userID + '/availableSurveys').orderByChild("completed").equalTo(false).once('value',
          // If the lookup works and the Promise is accepted, run here
          function (snapshot) {

            var availableSurveys = snapshot.val();

            logger.info("User %d has surveys available!", userID)

            // Get available Keys and number of available surveys
            var availableSurveyCount = snapshot.numChildren();
            var availableSurveyKeys = Object.keys(availableSurveys)

            // Grab a random available survey
            var randomSurveyKey = availableSurveyKeys[Math.floor(Math.random() * availableSurveyCount)]

            // Set that that survey as the current Survey
            logger.info("Setting User %d's current Survey to: %s...", randomSurveyKey)
            database.db.ref('users/' + userID + '/availableSurveys/' + randomSurveyKey).update({ "current": true });

            // Inform the user
            logger.info("Sending User %d the Start Survey prompt...", userID)
            object_sender.sendTextMessage(userID, "Looks like I do have a survey for you. Would you like to begin? ")

          }).catch(
          // Promise rejected (more likely to hit the higher level catch below than the one here)
          function (error) {
            logger.info("User %d has completed all available surveys...", userID);
            object_sender.sendTextMessage(userID, "Good job, you've answered all my questions!")
          });
      }
      // Promise rejected
    }).catch( function(error) {
      logger.info("User %d has no available surveys...", userID);
      object_sender.sendTextMessage(userID, "I don't have any surveys for you. Come back later!")
    });
};

/** Sends a user a given survey question */
survey_handler.surveyQuestionSender = function (userID, surveyID, questionNumber) {
  logger.info("Starting User %d on Survey: '%s'...", userID, surveyID)

  //  Get the Question
  database.db.ref("surveys/" + surveyID + "/questions").once("value", function (snapshot) {
    // Send it to the User
    object_sender.sendMessage(userID, snapshot.val()[questionNumber])
  });
};


/** Loops users through their current survey until they are done */
survey_handler.surveyLooper = function (userID, surveyID) {

  database.db.ref("users/" + userID + "/currentSurvey/" + surveyID).once("value", function (snapshot) {

    var finalQuestion = snapshot.child("finalQuestion").val();
    var currentQuestion = snapshot.child("currentQuestion").val();

    if (currentQuestion <= finalQuestion) {

      // Send them the current question for the current Survey
      logger.info("Sending User %d Question %d for Survey %s...", userID, currentQuestion, surveyID)
      survey_handler.surveyQuestionSender(userID, surveyID, currentQuestion)

    } else if (currentQuestion > finalQuestion) {
      // If the current question is greater than the number of questions available, survey done!
      logger.info("User %d has completed Survey %s!", userID, surveyID)

      // Send user an ending Prompt
      object_sender.sendTextMessage(userID, "Thanks for sharing your opinion with us!");

      // Update the available Survey state to complete, and make it inactive
      database.db.ref("users/" + userID + "/availableSurveys/" + surveyID).update({
        "completed": true,
        "current": false
      })

      // Remove the current Survey entry
      logger.info("Removing User %d's Current Survey: %s. ", userID, surveyID)
      database.db.ref("users/" + userID + "/currentSurvey/" + surveyID).remove();
    }
  });
};

/** Saves question answers in Firebase, and increment user State */
survey_handler.surveyAnswerSaver = function (userID, questionPayload, answer) {

  // Get the current Survey for the given user
  database.db.ref('users/' + userID + '/currentSurvey/').once("value", function (snapshot) {
    surveyID = Object.keys(snapshot.val())

    // Save the users answer using payload text and the new survey ID
    logger.info("Saving User %d response to Question %d on Survey '%s': %s...", userID, questionPayload, surveyID, answer)
    database.db.ref('responses/' + surveyID + '/' + userID + '/' + questionPayload).set({ "answer": answer });

    // Increment that users current Survey state
    logger.info("Increment User %d's current Survey State to Question %d on Survey '%s'...", userID, questionPayload++, surveyID)
    database.db.ref("users/" + userID + "/currentSurvey/" + surveyID).update({ "currentQuestion": questionPayload++ })
  });
}

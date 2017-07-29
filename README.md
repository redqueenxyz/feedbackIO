# feedbackAI

## Intro
This project is the Docker image for a NodeJS Facebook Messenger bot running on Google App Engine. [Feel free to go say hi!](https://www.messenger.com/t/opiAI) 


## Context
It was originally from the quickstart template providded by [Messenger Platform docs](https://developers.facebook.com/docs/messenger-platform/guides/quick-start) on [Glitch](https://developers.facebook.com/docs/messenger-platform/guides/quick-start), but has since grown quite a bit. 

![](pipeline.png)

This project has also being used to test the **Continous Integration / Continuous Deployment (CI/CD)** paradigm using:
1. `git` as the VCS.
2. Github as the collaborate development platform. 
3. Better Code Hub & `mocha` for testing.
4. Docker to containerize and register build versions.
5. Google App Engine with a `custom:flex` to deploy build versions. 

This is a working application of the [excellent guide I found here](https://medium.com/bettercode/how-to-build-a-modern-ci-cd-pipeline-5faa01891a5b). It is still under active exploration and experimentation.

## Goal
Build a responsive, engaging Messenger bot experience centered around acquiring qualitative feedback from Facebook users, in order to democratize data, acquire semantic/qualitiative relationships between users and products, acquire first-party consumer feedback, and train artifical intelligence agents. This (rudimentry) demo can currently ask you how you feel about the [Tesla M3](https://www.tesla.com/en_CA/model3): 
![](bot.gif)

## Dependencies  

### Core
    Node v7.10.0
    Docker version 17.03.1-ce, build c6d412e
    Google Cloud SDK 158.0.0

### Node
    "@google-cloud/debug-agent": "^2.0.0",
    "@google-cloud/logging-winston": "^0.5.0",
    "express": "^4.15.3",
    "request": "^2.81.0",
    "body-parser": "^1.17.1",
    "winston": "^2.3.1",
    "express-winston": "^2.4.0",
    "firebase-admin": "^4.2.1",
    "nodemon": "^1.11.0"
    "@google-cloud/nodejs-repo-tools": "1.3.1",
    "eslint": "^4.3.0",
    "eslint-config-google": "^0.9.1"


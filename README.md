# CowBell

## Synopsis
"CowBell" is a lightweight, sample project app where users that work for a business, e.g. Philz Coffee, Safeway, Jack 'N The Crack, can call out safety hazards.  As an onDemand application, users are assigned various "rights and respnosibilities", being able to fulfill a certain number of workflow updates, such as 1) create new hazard issue, 2) take a job, 3) cancel the identified hazard, and lastly: "fix the problem".

This application is WIP (Work In Progress), and is based on an earlier project of mine, which is far more comphrensive, complex, and rich with far more value-added features.  A "Category 5" application if you will.
This is application is currently WIP (Work In Progress), and is based on an earlier project of mine, which is far more comphrensive, complex, and rich with far more value-added features.  A "Category 5" application if you will.

## Pre-requisites
1. Mac OSX with OS version > Mavericks
2. Xcode version > 6.2
3. Node v4.0.0 installed and currently set as default
4. NPM cli
5. Have a git service setup on your local machine, e.g. GitHub or Bitbucket

## Instructions for setting up this sample project
1. Find a suitable directory withn your computer where you can clone this project
2. Once in the diretory of choice, clone this project by going to your Command Line Interpreter, and typing:  "git clone https://github.com/achang28/cowbell.git".  (You can also simply download my entire application package without any of this "git stuff" -- Github has a "download zip" button somewhere in my project)/
3. The folder "CowBell" will be created within your working directory.  As you are in the command line, go into this folder
4. In the command line, type "NPM install", and wait -- as a ton of dependency files will be installed (> 100 megabytes); so be patient. You'll know when you are done when you see something like this, with your command line cursor ready again
![Image of choosing device + IOS version](https://cloud.githubusercontent.com/assets/3760499/11664357/32279c26-9d96-11e5-94a0-33369e7bb65d.png)


## Instructions for getting Xcode to run app
1. Go into your finder.  In case you don't know, it is a Mac OS application that you can typically find in your System dock (it's the 2-faced-looking icon).
2. Navigate to the same directory you have been working in.  Once there, go into the "ios" directory
3. Double-click the "CowBell.xcodeproj" file.  Running this file will get the app closer to starting.
4. Choose your device and IOS version from the drop-dowmn menu.
![Image of choosing device + IOS version](https://cloud.githubusercontent.com/assets/3760499/11663655/4c3966a2-9d92-11e5-8d7b-1634d9ffc390.png)

5. Press the "play" button, highlighted in green at top left of picture below.  Ignore the warnings if there are no errors...for now.  Eventually -- perhaps between 5 and 10 seconds, the app will manifest as shown below.
![Ignore warnings](https://cloud.githubusercontent.com/assets/3760499/11664483/e06f3186-9d96-11e5-8089-6dec505d170a.png)

* This should at least get the Xcode simulator to run the app.  Please submit an issue if you are have any questions/suggestions/difficulties.

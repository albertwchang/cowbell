# CowBell

## Synopsis
"CowBell" is a lightweight, sample project app where users that work for a business, e.g. Philz Coffee, Safeway, Jack 'N The Crack, can call out safety hazards.  As an onDemand application, users are assigned various "rights and respnosibilities", being able to fulfill a certain number of workflow updates, such as 1) create new hazard issue, 2) take a job, 3) cancel the identified hazard, and lastly: "fix the problem".

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
4. In the command line, type "NPM install", and wait -- as a ton of dependency files will be installed (> 100 megabytes); so be patient. (You will know when the operation is complete once the cursing goes back to blicking in the command line the way it normally does).

## Instructions for getting Xcode to run app
1. Go into your finder.  In case you don't know, it is a Mac OS application that you can typically find System dock (it's the 2-faced-looking icon).
2. Navigate to the same directory you have been working in.  Once there, go into the "ios" directory
3. Double-click the "CowBell.xcodeproj" file.  Running this file will get the app closer to starting.
4. This next part is a little tricky.  You have to ensure certain settings are set correctly.  See attached image.

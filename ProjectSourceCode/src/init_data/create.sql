DROP TABLE IF EXISTS Users;
CREATE TABLE Users (
    userID int SERIAL PRIMARY KEY,
    username varchar(30) NOT NULL,
    userPassword varchar(30) NOT NULL,
    usertype ENUM('organizer', 'participant') NOT NULL
    firstname varchar(30) NOT NULL,
    lastname varchar(30) NOT NULL
);

DROP TABLE IF EXISTS Clubs;
CREATE TABLE Clubs (
    clubID int SERIAL PRIMARY KEY,
    clubName varchar(30) NOT NULL,
    organizer int FOREIGN KEY NOT NULL
);

DROP TABLE IF EXISTS RSVP;
CREATE TABLE RSVP (
    userID int,
    eventID int
);

DROP TABLE IF EXISTS Locations;
CREATE TABLE Locations (
    locationID int SERIAL PRIMARY KEY,
    buildingName varchar(30) NOT NULL,
    mapReference varchar(30) NOT NULL
);

DROP TABLE IF EXISTS Events;
CREATE TABLE Events (
    eventID int SERIAL PRIMARY KEY,
    eventName varchar(30) NOT NULL,
    location int FOREIGN KEY NOT NULL,
    eventDate date NOT NULL,
    club int FOREIGN KEY NOT NULL,
    roomNumber varchar(10) NOT NULL,
    eventDescription MEDIUMTEXT NOT NULL,
    startTime time NOT NULL,
    endTime time NOT NULL
);
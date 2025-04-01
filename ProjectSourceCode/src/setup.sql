CREATE TABLE Users (
    username varchar(30) NOT NULL,
    userPassword varchar(30) NOT NULL,
    userID int PRIMARY KEY,
    usertype ENUM('organizer', 'participant') NOT NULL

);

CREATE TABLE Clubs (
    clubID int PRIMARY KEY,
    clubName varchar(30) NOT NULL,
    organizer int NOT NULL
);

CREATE TABLE RSVP (
    userID int,
    eventID int
);

CREATE TABLE Locations (
    locationID int PRIMARY KEY,
    buildingName varchar(30) NOT NULL,
    mapReference varchar(30) NOT NULL
);

CREATE TABLE Events (
    eventID int PRIMARY KEY,
    eventName varchar(30) NOT NULL,
    building int NOT NULL,
    eventDate date NOT NULL,
    clubSponser int NOT NULL,
    roomNumber varchar(10) NOT NULL,
    eventDescription MEDIUMTEXT NOT NULL,
    startTime time NOT NULL,
    endTime time NOT NULL

);
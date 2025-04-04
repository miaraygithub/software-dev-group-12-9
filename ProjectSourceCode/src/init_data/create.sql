<<<<<<< HEAD
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
=======


CREATE TABLE users (
    userID SERIAL NOT NULL,
    userName VARCHAR(30) NOT NULL,
    userPassword VARCHAR(30) NOT NULL,
    userAdmin BOOL NOT NULL,
    PRIMARY KEY (userID)
);

CREATE TABLE clubs (
    clubID serial NOT NULL,
    clubName varchar(30) NOT NULL,
    organizer int NOT NULL,
    PRIMARY KEY (ClubID),
    CONSTRAINT FK_OrganizerUserID FOREIGN KEY (organizer) REFERENCES users (userID)
);

CREATE TABLE locations (
    locationID serial NOT NULL,
    buildingName varchar(30) NOT NULL,
    mapReference varchar(30) NOT NULL,
    PRIMARY KEY (locationID)
);

CREATE TABLE events (
    eventID serial NOT NULL,
    eventName varchar(30) NOT NULL,
    building int NOT NULL,
    eventDate date NOT NULL,
    clubSponser int NOT NULL,
    roomNumber varchar(10) NOT NULL,
    eventDescription text NOT NULL,
    startTime time NOT NULL,
    endTime time NOT NULL,
    PRIMARY KEY (eventID),
    CONSTRAINT FK_BuildingLocationID FOREIGN KEY (building) REFERENCES locations (locationID),
    CONSTRAINT FK_ClubSponserClubID FOREIGN KEY (clubSponser) REFERENCES clubs (clubID)
);

CREATE TABLE rsvp (
    userID int NOT NULL,
    eventID int NOT NULL,
    PRIMARY KEY (userID, eventID),
    CONSTRAINT FK_UserID FOREIGN KEY (userID) REFERENCES users (userID),
    CONSTRAINT FK_EventID FOREIGN KEY (eventID) REFERENCES events (eventID)
);
/*
INSERT INTO users (userName, userPassword, usertype)
VALUES 
('DevOrg1', '123', 'organizer'),
('DevOrg2', '123', 'organizer'),
('DevUser1', '123', 'participant'),
('DevUser2', '123', 'participant'),
('DevUser3', '123', 'participant');

INSERT INTO clubs (clubName, organizer)
VALUES 
('Club1', 1),
('Club2', 2);

INSERT INTO locations (buildingName, mapReference)
VALUES
('Building1', '(0,0)'),
('Building2', '(0,0)');

INSERT INTO events (eventName, building, eventDate, clubSponser, roomNumber, eventDescription, startTime, endTime)
VALUES 
('Event1', 1, '2025-05-01', 1, 'A100', 'Sample Event 1', '12:00:00', '12:30:00'),
('Event2', 2, '2025-05-01', 1, 'A100', 'Sample Event 2', '12:30:00', '13:00:00'),
('Event3', 1, '2925-05-02', 2, 'A100', 'Sample Event 3', '15:00:00', '17:00:00');
*/
>>>>>>> 2f2d93544b186db604880b1f081225e9745e3572

CREATE TABLE users (
    userID SERIAL NOT NULL,
    userName VARCHAR(30) NOT NULL,
    userPassword VARCHAR(60) NOT NULL,
    userAdmin BOOL NOT NULL,
    PRIMARY KEY (userID)
);

-- CREATE TABLE clubs (
--     clubID serial NOT NULL,
--     clubName varchar(30) NOT NULL,
--     organizer int NOT NULL,
--     PRIMARY KEY (ClubID),
--     CONSTRAINT FK_OrganizerUserID FOREIGN KEY (organizer) REFERENCES users (userID)
-- );

CREATE TABLE locations (
    locationID serial NOT NULL,
    buildingName varchar(30) NOT NULL,
    latitude FLOAT NOT NULL, 
    longitude FLOAT NOT NULL,
    PRIMARY KEY (locationID)
);

-- CREATE TABLE events (
--     eventID serial NOT NULL,
--     eventName varchar(30) NOT NULL,
--     building int NOT NULL,
--     eventDate date NOT NULL,
--     clubSponser int NOT NULL,
--     roomNumber varchar(10) NOT NULL,
--     eventDescription text NOT NULL,
--     startTime time NOT NULL,
--     endTime time NOT NULL,
--     PRIMARY KEY (eventID),
--     CONSTRAINT FK_BuildingLocationID FOREIGN KEY (building) REFERENCES locations (locationID),
--     CONSTRAINT FK_ClubSponserClubID FOREIGN KEY (clubSponser) REFERENCES clubs (clubID)
-- );

CREATE TABLE rsvp (
    userID int NOT NULL,
    eventID int NOT NULL,
    PRIMARY KEY (userID, eventID),
    CONSTRAINT FK_UserID FOREIGN KEY (userID) REFERENCES users (userID),
    CONSTRAINT FK_EventID FOREIGN KEY (eventID) REFERENCES events (eventID)
);
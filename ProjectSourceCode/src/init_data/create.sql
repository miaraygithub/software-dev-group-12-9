CREATE TABLE Users (
    userName varchar(30) NOT NULL,
    userPassword varchar(30) NOT NULL,
    userID serial NOT NULL,
    usertype ENUM('organizer', 'participant') NOT NULL,
    PRIMARY KEY (userID)
);

CREATE TABLE Clubs (
    clubID serial NOT NULL,
    clubName varchar(30) NOT NULL,
    organizer int NOT NULL,
    PRIMARY KEY (ClubID),
    CONSTRAINT FK_OrganizerUserID FOREIGN KEY (organizer) REFERENCES Users (userID)
);

CREATE TABLE Locations (
    locationID serial NOT NULL,
    buildingName varchar(30) NOT NULL,
    mapReference varchar(30) NOT NULL,
    PRIMARY KEY (locationID)
);

CREATE TABLE Events (
    eventID serial NOT NULL,
    eventName varchar(30) NOT NULL,
    building int NOT NULL,
    eventDate date NOT NULL,
    clubSponser int NOT NULL,
    roomNumber varchar(10) NOT NULL,
    eventDescription MEDIUMTEXT NOT NULL,
    startTime time NOT NULL,
    endTime time NOT NULL,
    PRIMARY KEY (eventID),
    CONSTRAINT FK_BuildingLocationID FOREIGN KEY (building) REFERENCES Locations (locationID),
    CONSTRAINT FK_ClubSponserClubID FOREIGN KEY (clubSponser) REFERENCES Clubs (clubID)
);

CREATE TABLE RSVP (
    userID int NOT NULL,
    eventID int NOT NULL,
    PRIMARY KEY (userID, eventID),
    CONSTRAINT FK_UserID FOREIGN KEY (userID) REFERENCES Users (userID),
    CONSTRAINT FK_EventID FOREIGN KEY (eventID) REFERENCES Events (eventID)
);
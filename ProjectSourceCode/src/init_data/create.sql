CREATE TABLE users (
    userID SERIAL NOT NULL,
    userName VARCHAR(30) NOT NULL,
    userPassword VARCHAR(60) NOT NULL,
    userAdmin BOOL NOT NULL,
    PRIMARY KEY (userID)
);

CREATE TABLE club_categories (
    categoryID SERIAL NOT NULL,
    categoryName VARCHAR(30) NOT NULL,
    PRIMARY KEY (categoryID)
);

CREATE TABLE clubs (
    clubID serial NOT NULL,
    clubName varchar(60) NOT NULL,
    clubDescription text NOT NULL,
    organizer int NOT NULL,
    category int NOT NULL,
    PRIMARY KEY (ClubID),
    CONSTRAINT FK_OrganizerUserID FOREIGN KEY (organizer) REFERENCES users (userID),
    CONSTRAINT FK_ClubCategoryID FOREIGN KEY (category) REFERENCES club_categories (categoryID)
);

CREATE TABLE users_to_clubs (
    userID int NOT NULL,
    clubID int NOT NULL,
    CONSTRAINT FK_UserID FOREIGN KEY (userID) REFERENCES users (userID),
    CONSTRAINT FK_clubID FOREIGN KEY (clubID) REFERENCES clubs (clubID)
);

CREATE TABLE locations (
    locationID serial NOT NULL,
    buildingName varchar(30) NOT NULL,
    latitude FLOAT NOT NULL, 
    longitude FLOAT NOT NULL,
    PRIMARY KEY (locationID)
);

CREATE TABLE events (
    eventID serial NOT NULL,
    eventName varchar(30) NOT NULL,
    building int NOT NULL,
    eventDate date NOT NULL,
    clubSponsor int NOT NULL,
    roomNumber varchar(10) NOT NULL,
    eventDescription text NOT NULL,
    startTime time NOT NULL,
    endTime time NOT NULL,
    PRIMARY KEY (eventID),
    CONSTRAINT FK_BuildingLocationID FOREIGN KEY (building) REFERENCES locations (locationID),
    CONSTRAINT FK_ClubSponsorClubID FOREIGN KEY (clubSponsor) REFERENCES clubs (clubID)
);

CREATE TABLE comments (
  commentid SERIAL PRIMARY KEY,
  eventid INT REFERENCES events(eventid),
  username TEXT,
  comment_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rsvp (
    userID int NOT NULL,
    eventID int NOT NULL,
    PRIMARY KEY (userID, eventID),
    CONSTRAINT FK_UserID FOREIGN KEY (userID) REFERENCES users (userID),
    CONSTRAINT FK_EventID FOREIGN KEY (eventID) REFERENCES events (eventID)
);
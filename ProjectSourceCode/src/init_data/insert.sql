<<<<<<< HEAD
INSERT INTO Users(username, userPassword, usertype, firstname, lastname) VALUES {
    ('JohnDoe', 'JohnPwd', 1, 'John', 'Doe'),
    ('MaryAnn', 'MaryPwd', 0, 'Mary', 'Jane')
};

INSERT INTO Clubs(clubName, organizer) VALUES ('Soccer Team', 2);

INSERT INTO Events(*) VALUES (1, 'Game 1', 3, 2025-04-01, 1, 'n/a', 'First soccer game', 17:00:00, 19:00:00);
=======
INSERT INTO users (userName, userPassword, userAdmin)
VALUES 
('DevOrg1', '123', True),
('DevOrg2', '123', True),
('DevUser1', '123', False),
('DevUser2', '123', False),
('DevUser3', '123', False);

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
>>>>>>> 2f2d93544b186db604880b1f081225e9745e3572

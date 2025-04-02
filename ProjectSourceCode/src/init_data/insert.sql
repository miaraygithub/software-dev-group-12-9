INSERT INTO Users (userName, userPassword, usertype)
VALUES 
('DevOrg1', '123', 'organizer'),
('DevOrg2', '123', 'organizer'),
('DevUser1', '123', 'participant'),
('DevUser2', '123', 'participant'),
('DevUser3', '123', 'participant');

INSERT INTO Clubs (clubName, organizer)
VALUES 
('Club1', 1),
('Club2', 2);

INSERT INTO Locations (buildingName, mapReference)
VALUES
('Building1', '(0,0)'),
('Building2', '(0,0)');

INSERT INTO Events (eventName, building, eventDate, clubSponser, roomNumber, eventDescription, startTime, endTime)
VALUES 
('Event1', 1, '2025-05-01', 1, 'A100', 'Sample Event 1', '12:00:00', '12:30:00'),
('Event2', 2, '2025-05-01', 1, 'A100', 'Sample Event 2', '12:30:00', '13:00:00'),
('Event3', 1, '2925-05-02', 2, 'A100', 'Sample Event 3', '15:00:00', '17:00:00');

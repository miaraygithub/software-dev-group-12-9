INSERT INTO users (userName, userPassword, userAdmin)
VALUES 
('DevOrg1', 'Dev', 'Org', '123', True),
('DevOrg2', 'Dev', 'Org2','123', True),
('DevUser1', 'Dev', 'User2','123', False),
('DevUser2', 'Dev', 'User2','123', False),
('DevUser3', 'Dev', 'User3','123', False);

INSERT INTO clubs (clubName, organizer)
VALUES 
('Club1', 'This is sample club 1.', 1),
('Club2', 'This is sample club 2.', 2);

INSERT INTO locations (buildingName, latitude, longitude)
VALUES
('Engineering Center', 40.00778025448611, -105.2628971666162),
('Farrand Field', 40.00623553933844, -105.26753829213942),
('CU Events Center', 40.00482478268252, -105.26063671328444),
('Fiske Planetarium',  40.00377792555908, -105.26348057398349),
('UMC', 40.00645742536936, -105.2719800300434),
('Muenzinger Auditorium', 40.0085036736933, -105.26889012541018),
('Folsom Field', 40.00956375410968, -105.26684091782647),
('Macky Auditorium', 40.01010611447159, -105.27278469274782),
('Norlin Library', 40.00880772946871, -105.27078912943777),
('Kittredge Field', 40.003046875220576, -105.25962041124946),
('Koelbel', 40.00568493017682, -105.26347206326568),
('CASE', 40.006414911245734, -105.2701860457083);


INSERT INTO events (eventName, building, eventDate, clubSponser, roomNumber, eventDescription, startTime, endTime)
VALUES 
('Event1', 1, '2025-05-01', 1, 'A100', 'Sample Event 1', '12:00:00', '12:30:00'),
('Event2', 2, '2025-05-01', 1, 'A100', 'Sample Event 2', '12:30:00', '13:00:00'),
('Event3', 3, '2925-05-02', 2, 'A100', 'Sample Event 3', '15:00:00', '17:00:00');

INSERT INTO Users(username, userPassword, usertype, firstname, lastname) VALUES {
    ('JohnDoe', 'JohnPwd', 1, 'John', 'Doe'),
    ('MaryAnn', 'MaryPwd', 0, 'Mary', 'Jane')
};

INSERT INTO Clubs(clubName, organizer) VALUES ('Soccer Team', 2);

INSERT INTO Events(*) VALUES (1, 'Game 1', 3, 2025-04-01, 1, 'n/a', 'First soccer game', 17:00:00, 19:00:00);
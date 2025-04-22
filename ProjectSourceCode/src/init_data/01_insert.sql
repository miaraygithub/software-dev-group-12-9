INSERT INTO clubs (clubName)
VALUES 
('Club1'),
('Club2');

INSERT INTO users (userName, userPassword, userAdmin, adminClub)
VALUES --DO NOT USE THESE TO LOG IN. PASSWORD IS NOT ENCODED--
('Default Organizer 1', '123', True, 1),
('Default Organizer 2', '123', True, 2);

INSERT INTO users (userName, userPassword, userAdmin)
VALUES --DO NOT USE THESE TO LOG IN. PASSWORD IS NOT ENCODED--
('Default User 1', '123', False),
('Default User 2', '123', False),
('Default User 3', '123', False);

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
('CASE', 40.006564686954675, -105.2705847384917),
('Math Building', 40.007736584619046, -105.26455796220422), 
('ATLAS', 40.007460476654884, -105.2699587766818),
('Hallet Hall', 40.00503999333933, -105.26496743582884);

INSERT INTO building_aliases (alias, buildingID)
VALUES 
  ('Engineering Center', 1),
  ('EC', 1),
  ('Eng Center', 1),
  ('Farrand Field',2),
  ('Farrand',2),
  ('CU Events Center',3),
  ('Recreation Center',3),
  ('Rec Center',3),
  ('Rec',3),
  ('Fiske Planetarium', 4),
  ('UMC',5),
  ('University Memorial Center',5),
  ('Muenzinger Auditorium', 6),
  ('Muenzinger', 6),
  ('MUEN', 6),
  ('Folsom Field', 7),
  ('Macky Auditorium', 8),
  ('Norlin Library', 9),
  ('Kittredge Field',10),
  ('Kittredge',10),
  ('Koelbel', 11),
  ('CASE', 12),
  ('Math Building', 13),
  ('Mathematics', 13),
  ('MATH', 13),
  ('ATLAS',14),
  ('Atlas Center',14),
  ('Atlas',14),
  ('Hallet Hall',15),
  ('Hallet',15);

INSERT INTO events (eventName, building, eventDate, clubSponser, roomNumber, eventDescription, startTime, endTime)
VALUES 
('Event1', 1, '2025-05-01', 1, 'A100', '10 Words: Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ', '12:00:00', '12:30:00'),
('Event2', 2, '2025-05-01', 1, 'A100', '50 Words: Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate ', '12:30:00', '13:00:00'),
('Event3', 3, '2925-05-02', 2, 'A100', '200 Words: Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.

In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus.

Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi. Nam eget dui. Etiam rhoncus. Maecenas tempus, tellus eget condimentum rhoncus, sem quam semper libero, sit amet adipiscing sem neque sed ipsum. Nam quam nunc, blandit vel, luctus pulvinar, hendrerit id, lorem. Maecenas nec odio et ante tincidunt tempus. Donec vitae sapien ut libero venenatis faucibus. Nullam quis ante. Etiam sit amet orci eget eros faucibus tincidunt. Duis leo. Sed fringilla mauris sit amet nibh. Donec sodales sagittis magna. Sed consequat, leo eget bibendum sodales, augue velit cursus nunc, ', '15:00:00', '17:00:00');

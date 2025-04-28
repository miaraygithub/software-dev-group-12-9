# CSCI 3308-012-09 Group Project
## Application
Buffs Bulletin is a event-based scheduler for CU Boulder Students. The application has an interactive map where students can create, click on, view, and RSVP to campus events. Users can create different types of accounts (organizer, attendee). Organizers have the ability to create events, and attendees can view them and RSVP to them. Other features on the map include the ability to rate and comment on events, as well as viewing other participants at an event that the user has RSVP'd to. In addition to the map, the application will have a separate 'user profile' page where users can send friend requests, update their user information, and logout. 

Organizers should be linked to a specific group or club on campus, and each club should have a limited number of coordinators. This feature allows users to sort events by club or organization.

Attendees cannot create or delete events, only RSVP to/comment/rate events, which causes them to appear on a custom 'My Events' map that users can toggle.

Users should be able to filter events by time, showing events in a specific time frame or period. Users should expand the sidebar to see more event details such as the event description.

Users are also able to send and receive friend requests from other users.

## Contributors
Mia Ray, Jessie Hsu, Jules Novoa, Julia Aronow, & Makaela Fauber

## Technology Stack
Front-end: HTML, CSS, Bootstrap, Handlebars, JS
Back-end: PostgreSQL, Node.js, Express in JS, Handlebars, Mapbox API

## Prerequisites

## How to run the application locally
1. Create .env file in ProjectSourceCode folder and copy following code into .env:
```
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="pwd"
POSTGRES_HOST="db"
POSTGRES_DB="buff_bulletin_db"
```
2. Start Docker application and services 
```
docker compose up
```
3. Go to localhost:3000

## Link to Deployed Application

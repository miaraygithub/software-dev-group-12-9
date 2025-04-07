const { decodeBase64 } = require("bcryptjs");

async function saveEvent() {
    let event_name = document.getElementById("event_name").value;
    let event_building = document.getElementById("event_building").value;
    let event_room_number = document.getElementById("event_room_number").value;
    let event_start_time = document.getElementById("event_start_time").value;
    let event_end_time = document.getElementById("event_end_time").value;
    let event_description = document.getElementById("event_description").value;
    
    var getbuilding = 'SELECT buildingid FROM locations WHERE buildingName = $1;';
    var query = 'INSERT INTO events () VALUES ';
    
    try {
        buildingID = await db.one(getbuilding, [event_building]);
        
    } catch (err) {

    }

    const eventDetails = {
        name: event_name,// name of the event from the form,
        category: event_category,
        weekday: event_weekday,//weekday of the event from the form,
        time: event_time,//time of the event from the form,
        modality: event_modality,//modality of the event from the form,
        location: event_location,//if the modality is "In-person" then this has a value and remote_url is null,
        remote_url: event_remote_url, //if the modality is "Remote" then this has a value location is null,
        attendees: event_attendees//list of attendees from the form
    };
}
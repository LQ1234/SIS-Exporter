

function extractClasses() {
    return Array.from(document.querySelectorAll("[id^=win0divDERIVED_REGFRM1_DESCR20]")).map((classEl) => {
        let classElSelector = "#" + classEl.id.replaceAll("$","\\$");
        let className = document.querySelector(classElSelector + " .PAGROUPDIVIDER").innerText;
        let components = Array.from(document.querySelectorAll(classElSelector + " [id*=trCLASS_MTG_VW]")).map((componentEl) => {
            let componentElSelector = "#" + componentEl.id.replaceAll("$","\\$");
            let componentName = document.querySelector(componentElSelector + " [id^=MTG_COMP]").innerText;
            let daysAndTimes = document.querySelector(componentElSelector + " [id^=MTG_SCHED]").innerText;
            let room = document.querySelector(componentElSelector + " [id^=MTG_LOC]").innerText;
            let instructor = document.querySelector(componentElSelector + " [id*=TL_SSR_INSTR_LONG] span").innerText;
            let dates = document.querySelector(componentElSelector + " [id^=MTG_DATES]").innerText;
            
            let daysOfWeek = ["Mo", "Tu", "We", "Th", "Fr"].map(day => daysAndTimes.includes(day))
            let times = daysAndTimes.match(/(\d{1,2}:\d{2}[AP]M)/g)

            if(times === null) return null;

            let startTime = times[0];
            let endTime = times[1];

            let datesMatch = dates.match(/(\d{2}\/\d{2}\/\d{4})/g);
            let startDate = datesMatch[0];
            let endDate = datesMatch[1];

            return {
                componentName,
                daysAndTimes: {
                    daysOfWeek,
                    startTime,
                    endTime
                },
                room,
                instructor,
                dates: {
                    startDate,
                    endDate
                }
            }
        }).filter((x) => x !== null);
        return {
            className,
            components
        }
    })
}

function generateICScomponent(class_name, component) {
    // component: 
    // {
    //     "componentName": "Lecture",
    //     "daysAndTimes": {
    //         "daysOfWeek": [
    //             false,
    //             true,
    //             false,
    //             true,
    //             false
    //         ],
    //         "startTime": "10:30AM",
    //         "endTime": "11:45AM"
    //     },
    //     "room": "Joyce Cummings Center, 270",
    //     "instructor": "Megan Monroe",
    //     "dates": {
    //         "startDate": "09/05/2023",
    //         "endDate": "12/11/2023"
    //     }
    // }
    let parseDate = (date) => {
        let dateArray = date.split("/").map((x) => parseInt(x));
        return [dateArray[2], dateArray[0], dateArray[1]];
    }
    let startDateArray = parseDate(component.dates.startDate);
    let endDateArray = parseDate(component.dates.endDate);
    // regex parse StartTime and EndTime

    let parseTime = (time) => {
        let timeArray = time.match(/(\d{1,2}):(\d{2})([AP]M)/).slice(1);
        timeArray[0] = parseInt(timeArray[0]) % 12;
        if(timeArray[2] === "PM") timeArray[0] += 12;
        timeArray[1] = parseInt(timeArray[1]);
        return timeArray.slice(0,2);
    }

    let startTimeArray = parseTime(component.daysAndTimes.startTime);
    let endTimeArray = parseTime(component.daysAndTimes.endTime);

    let event_name = `${class_name}: ${component.componentName}`;

    "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;INTERVAL=1;UNTIL=20230823T000000Z"
    let rruleDOW = ["MO", "TU", "WE", "TH", "FR"].filter((day, index) => component.daysAndTimes.daysOfWeek[index]).join(",");
    let pad = (num, len) => num.toString().padStart(len, "0");
    let rruleUntil =  `${pad(endDateArray[0], 4)}${pad(endDateArray[1], 2)}${pad(endDateArray[2], 2)}T000000Z`;
    let rrule = `FREQ=WEEKLY;BYDAY=${rruleDOW};INTERVAL=1;UNTIL=${rruleUntil}`;
    
    let event = {
        title: event_name,
        start: [...startDateArray, ...startTimeArray],
        end: [...startDateArray, ...endTimeArray],
        description: `Instructor: ${component.instructor}`,
        location: component.room,
        recurrenceRule: rrule
    }
    return event;
}

function generateICS(classes) {
    let events = classes.map((class_) => {
        return class_.components.map((component) => {
            return generateICScomponent(class_.className, component);
        })
    })
    return events.flat(2);
}


import { createEvents} from 'ics';


if (window.location.href.startsWith("https://siscs.it.tufts.edu/psc/csprd/EMPLOYEE/PSFT_SA/c/SA_LEARNER_SERVICES.SSR_SSENRL_LIST.GBL")){

    async function handleDownload() {
        let events = generateICS(extractClasses());

        const filename = 'Export.ics'
        const file = await new Promise((resolve, reject) => {
            createEvents(events, (error, value) => {
                if (error) {
                    reject(error)
                }
        
                resolve(new File([value], filename, { type: 'text/calendar' }))
            })
        })
        const url = URL.createObjectURL(file);
    
        // trying to assign the file URL to a window could cause cross-site
        // issues so this is a workaround using HTML5
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
    
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
    
        URL.revokeObjectURL(url);
    }
    handleDownload();
} else {
    window.location.href = "https://siscs.it.tufts.edu/psc/csprd/EMPLOYEE/PSFT_SA/c/SA_LEARNER_SERVICES.SSR_SSENRL_LIST.GBL";
} 

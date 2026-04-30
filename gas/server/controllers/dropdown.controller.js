function getEventNameDropdown(userRole) {
  const eventSheet = getEventSheet();
  const eventData = getRowsFromSheet(eventSheet);
  const roleValue = userRole ? userRole : "USER";

  if (roleValue === USER_ROLE || roleValue === MANAGER_ROLE) {
    console.log(roleValue === USER_ROLE || roleValue === MANAGER_ROLE);
    const now = new Date();
    return eventData
      .filter((event) => {
        return (
          now > normalizeDate(event.Opening_At) &&
          now < normalizeDate(event.Closing_At) &&
          String(event.Status).toLowerCase() ===
            String(EVENT_STATUS[0]).toLowerCase()
        );
      })
      .map((event) => event.Event_Name);
  }

  return eventData.map((event) => event.Event_Name);
}

function getJobTypeDropdown() {
  const jobTypeSheet = getJobTypeSheet();
  const jobTypeData = getRowsFromSheet(jobTypeSheet);
  return jobTypeData
    .map((job) => {
      return {
        name: job.Name,
      };
    })
    .sort();
}

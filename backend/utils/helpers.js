const getColumnTitle = (status) => {
  const columnTitles = {
    'todo': 'To Do',
    'inProgress': 'In Progress',
    'done': 'Done'
  };
  return columnTitles[status] || status;
};

module.exports = {
  getColumnTitle
};

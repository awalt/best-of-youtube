
const getLatestVotes = require('./getLatestVotes');

async function getLatestVotesForAll() {
  const latestVotes = await getLatestVotes();

  console.log(latestVotes);


}

getLatestVotesForAll();
const ScenarioCircle = require('./scenario-circle');
const ScenarioStraight = require('./scenario-straight');

const Scenario = {
  ...ScenarioCircle,
  ...ScenarioStraight
};

function loadScenario(name, isLive, duration) {
  // Construct proper scenario for live vs log
  const scenarioName = isLive ? name : name + '_log';

  const scenario = Scenario[scenarioName];
  if (!scenario) {
    throw new Error('No scenario named ' + scenario + 'found.');
  }

  const data = {
    metadata: JSON.stringify(scenario.metadata),
    frames: [],
    timing: []
  };

  const hz = 10;
  const frameLimit = duration * hz;

  for (let i = 0; i < frameLimit; i++) {
    const frame = scenario.generator.getFrame(i);
    data.timing.push(frame.data.updates[0].timestamp);
    data.frames.push(JSON.stringify(frame));
  }

  return data;
}

module.exports = {
  loadScenario
};

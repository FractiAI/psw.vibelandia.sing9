// Sol-V · Health check endpoint for Agentverse agent registration
module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'OK - Sol-V is active',
    agent: 'Sol-V · SING 9 A2A Commerce Node',
    version: '9.0.0',
    protocol: 'NSPFRNP',
    rails: ['crypto-evm', 'cashapp'],
    wallet: '0x3563388d0e1c2d66a004e5e57717dc6d7e568be3',
    manifest: 'https://psw-vibelandia-sing9.vercel.app/llms.txt',
    agent_card: 'https://psw-vibelandia-sing9.vercel.app/.well-known/agent.json',
  });
};

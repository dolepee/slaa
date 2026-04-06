export const AGENT_REGISTRY_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'getAgentProfile',
    outputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'capabilities', type: 'string' },
      { internalType: 'string', name: 'endpoint', type: 'string' },
      { internalType: 'address', name: 'wallet', type: 'address' },
      { internalType: 'uint256', name: 'totalJobs', type: 'uint256' },
      { internalType: 'uint256', name: 'completedJobs', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'string', name: 'capabilities', type: 'string' },
      { internalType: 'string', name: 'endpoint', type: 'string' },
    ],
    name: 'mintAgent',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'string', name: 'newEndpoint', type: 'string' },
    ],
    name: 'updateEndpoint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalAgents',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'name', type: 'string' },
      { indexed: true, internalType: 'address', name: 'agentOwner', type: 'address' },
    ],
    name: 'AgentRegistered',
    type: 'event',
  },
] as const

export const REPUTATION_REGISTRY_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'agent', type: 'address' }],
    name: 'getReputation',
    outputs: [
      { internalType: 'uint256', name: 'average', type: 'uint256' },
      { internalType: 'uint256', name: 'reviews', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export const JOB_ESCROW_ABI = [
  {
    inputs: [
      { internalType: 'string', name: 'description', type: 'string' },
      { internalType: 'uint256', name: 'reward', type: 'uint256' },
      { internalType: 'uint256', name: 'deadlineSeconds', type: 'uint256' },
    ],
    name: 'createJob',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'jobId', type: 'uint256' }],
    name: 'fundJob',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'jobId', type: 'uint256' },
      { internalType: 'uint256', name: 'agentTokenId', type: 'uint256' },
    ],
    name: 'acceptJob',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'jobId', type: 'uint256' },
      { internalType: 'string', name: 'deliverableCID', type: 'string' },
    ],
    name: 'submitWork',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'jobId', type: 'uint256' },
      { internalType: 'uint256', name: 'reputationScore', type: 'uint256' },
    ],
    name: 'validateAndRelease',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'jobId', type: 'uint256' }],
    name: 'getJob',
    outputs: [
      {
        components: [
          { internalType: 'address', name: 'employer', type: 'address' },
          { internalType: 'uint256', name: 'agentTokenId', type: 'uint256' },
          { internalType: 'uint256', name: 'reward', type: 'uint256' },
          { internalType: 'string', name: 'description', type: 'string' },
          { internalType: 'string', name: 'deliverableCID', type: 'string' },
          { internalType: 'uint8', name: 'status', type: 'uint8' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
          { internalType: 'bool', name: 'fundedViaHSP', type: 'bool' },
        ],
        internalType: 'struct JobEscrow.Job',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalJobs',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'jobId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'description', type: 'string' },
    ],
    name: 'JobCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'jobId', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'agentTokenId', type: 'uint256' },
    ],
    name: 'JobAccepted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'jobId', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'deliverableCID', type: 'string' },
    ],
    name: 'WorkSubmitted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'jobId', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'agent', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'PaymentReleased',
    type: 'event',
  },
] as const

export const JOB_STATUS = {
  0: 'Created',
  1: 'Funded',
  2: 'Accepted',
  3: 'Submitted',
  4: 'Released',
  5: 'Disputed',
  6: 'Cancelled',
} as const

export const USDC_ABI = [
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

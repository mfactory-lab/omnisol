export interface Omnisol {
  'version': '0.0.4'
  'name': 'omnisol'
  'instructions': [
    {
      'name': 'initPool'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'poolMint'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'poolAuthority'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'addManager'
      'accounts': [
        {
          'name': 'pool'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'managerWallet'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'manager'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'removeManager'
      'accounts': [
        {
          'name': 'pool'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'manager'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'managerWallet'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'pausePool'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'manager'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
      ]
      'args': []
    },
    {
      'name': 'resumePool'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'manager'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
      ]
      'args': []
    },
    {
      'name': 'addToWhitelist'
      'accounts': [
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'addressToWhitelist'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'pool'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'whitelist'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'manager'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'removeFromWhitelist'
      'accounts': [
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'whitelist'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'manager'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'addressToWhitelist'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'blockUser'
      'accounts': [
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'manager'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'user'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'userWallet'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'unblockUser'
      'accounts': [
        {
          'name': 'manager'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'user'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'userWallet'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'closePool'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'depositLp'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'poolAuthority'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'user'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'collateral'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'source'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'destination'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'whitelist'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'lpToken'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'clock'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'tokenProgram'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': [
        {
          'name': 'amount'
          'type': 'u64'
        },
      ]
    },
    {
      'name': 'depositStake'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'poolAuthority'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'user'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'collateral'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'sourceStake'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'clock'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'stakeProgram'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'mintOmnisol'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'poolMint'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'poolAuthority'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'user'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'collateral'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'userPoolToken'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'stakedAddress'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'clock'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'tokenProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': [
        {
          'name': 'amount'
          'type': 'u64'
        },
      ]
    },
    {
      'name': 'withdrawLpTokens'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'poolAuthority'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'user'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'collateral'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'source'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'destination'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'lpToken'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'poolMint'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'userPoolToken'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'clock'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'tokenProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': [
        {
          'name': 'amount'
          'type': 'u64'
        },
      ]
    },
    {
      'name': 'withdrawStake'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'poolAuthority'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'user'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'collateral'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'poolMint'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'sourceStake'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'splitStake'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'userPoolToken'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'clock'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'stakeProgram'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'tokenProgram'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': [
        {
          'name': 'amount'
          'type': 'u64'
        },
      ]
    },
    {
      'name': 'withdrawSol'
      'accounts': [
        {
          'name': 'pool'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'poolMint'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'poolAuthority'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'sourceTokenAccount'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'clock'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'stakeProgram'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'tokenProgram'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': [
        {
          'name': 'amount'
          'type': 'u64'
        },
      ]
    },
    {
      'name': 'initOracle'
      'accounts': [
        {
          'name': 'pool'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'oracle'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'oracleAuthority'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'closeOracle'
      'accounts': [
        {
          'name': 'pool'
          'isMut': false
          'isSigner': false
        },
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'oracle'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': []
    },
    {
      'name': 'updateOracleInfo'
      'accounts': [
        {
          'name': 'authority'
          'isMut': true
          'isSigner': true
        },
        {
          'name': 'oracle'
          'isMut': true
          'isSigner': false
        },
        {
          'name': 'systemProgram'
          'isMut': false
          'isSigner': false
        },
      ]
      'args': [
        {
          'name': 'addresses'
          'type': {
            'vec': 'publicKey'
          }
        },
        {
          'name': 'values'
          'type': {
            'vec': 'u64'
          }
        },
      ]
    },
  ]
  'accounts': [
    {
      'name': 'pool'
      'type': {
        'kind': 'struct'
        'fields': [
          {
            'name': 'poolMint'
            'docs': [
              'Pool tokens are issued when assets are deposited.',
            ]
            'type': 'publicKey'
          },
          {
            'name': 'authority'
            'docs': [
              'An account with authority that can manage and close the pool.',
            ]
            'type': 'publicKey'
          },
          {
            'name': 'depositAmount'
            'docs': [
              'Total stake in deposit',
            ]
            'type': 'u64'
          },
          {
            'name': 'authorityBump'
            'docs': [
              'Signer bump seed for deriving PDA seeds',
            ]
            'type': 'u8'
          },
          {
            'name': 'isActive'
            'docs': [
              'Flag that indicates that the pool is running or paused',
            ]
            'type': 'bool'
          },
        ]
      }
    },
    {
      'name': 'oracle'
      'type': {
        'kind': 'struct'
        'fields': [
          {
            'name': 'authority'
            'docs': [
              'Oracle wallet that can manage oracle info',
            ]
            'type': 'publicKey'
          },
          {
            'name': 'priorityQueue'
            'docs': [
              'Priority queue with collaterals by users rate in ascending order',
            ]
            'type': {
              'vec': {
                'defined': 'QueueMember'
              }
            }
          },
        ]
      }
    },
    {
      'name': 'collateral'
      'type': {
        'kind': 'struct'
        'fields': [
          {
            'name': 'user'
            'docs': [
              'User PDA with wallet that has authority of the staking pool',
            ]
            'type': 'publicKey'
          },
          {
            'name': 'pool'
            'docs': [
              'Address of the global pool',
            ]
            'type': 'publicKey'
          },
          {
            'name': 'sourceStake'
            'docs': [
              'An account of staking pool or LP token',
            ]
            'type': 'publicKey'
          },
          {
            'name': 'delegationStake'
            'docs': [
              'An amount of delegated staked tokens',
            ]
            'type': 'u64'
          },
          {
            'name': 'amount'
            'docs': [
              'An amount of minted pool tokens',
            ]
            'type': 'u64'
          },
          {
            'name': 'liquidatedAmount'
            'docs': [
              'An amount of "liquidated" staked tokens',
            ]
            'type': 'u64'
          },
          {
            'name': 'createdAt'
            'docs': [
              'Time of collateral\'s creation',
            ]
            'type': 'i64'
          },
          {
            'name': 'bump'
            'docs': [
              'Signer bump seed for deriving PDA seeds',
            ]
            'type': 'u8'
          },
          {
            'name': 'isNative'
            'docs': [
              'Flag that indicates the type of stake (can be LP token account or native staking pool)',
            ]
            'type': 'bool'
          },
        ]
      }
    },
    {
      'name': 'whitelist'
      'type': {
        'kind': 'struct'
        'fields': [
          {
            'name': 'whitelistedToken'
            'docs': [
              'Token mint address that is whitelisted to the pool',
            ]
            'type': 'publicKey'
          },
          {
            'name': 'pool'
            'docs': [
              'Pool address',
            ]
            'type': 'publicKey'
          },
        ]
      }
    },
    {
      'name': 'manager'
      'type': {
        'kind': 'struct'
        'fields': [
          {
            'name': 'manager'
            'docs': [
              'Manager wallet address',
            ]
            'type': 'publicKey'
          },
        ]
      }
    },
    {
      'name': 'user'
      'type': {
        'kind': 'struct'
        'fields': [
          {
            'name': 'wallet'
            'docs': [
              'Wallet of registered user',
            ]
            'type': 'publicKey'
          },
          {
            'name': 'rate'
            'docs': [
              'Rate value for priority queue',
            ]
            'type': 'u64'
          },
          {
            'name': 'isBlocked'
            'docs': [
              'Flag that indicates that the user is blocked or not',
            ]
            'type': 'bool'
          },
        ]
      }
    },
  ]
  'types': [
    {
      'name': 'QueueMember'
      'type': {
        'kind': 'struct'
        'fields': [
          {
            'name': 'collateral'
            'type': 'publicKey'
          },
          {
            'name': 'amount'
            'type': 'u64'
          },
        ]
      }
    },
  ]
  'events': [
    {
      'name': 'DepositStakeEvent'
      'fields': [
        {
          'name': 'pool'
          'type': 'publicKey'
          'index': true
        },
        {
          'name': 'collateral'
          'type': 'publicKey'
          'index': true
        },
        {
          'name': 'delegationStake'
          'type': 'u64'
          'index': false
        },
        {
          'name': 'amount'
          'type': 'u64'
          'index': false
        },
        {
          'name': 'timestamp'
          'type': 'i64'
          'index': false
        },
      ]
    },
    {
      'name': 'WithdrawStakeEvent'
      'fields': [
        {
          'name': 'pool'
          'type': 'publicKey'
          'index': true
        },
        {
          'name': 'collateral'
          'type': 'publicKey'
          'index': true
        },
        {
          'name': 'amount'
          'type': 'u64'
          'index': false
        },
        {
          'name': 'restAmount'
          'type': 'u64'
          'index': false
        },
        {
          'name': 'timestamp'
          'type': 'i64'
          'index': false
        },
      ]
    },
    {
      'name': 'WithdrawSolEvent'
      'fields': [
        {
          'name': 'pool'
          'type': 'publicKey'
          'index': true
        },
        {
          'name': 'authority'
          'type': 'publicKey'
          'index': false
        },
        {
          'name': 'amount'
          'type': 'u64'
          'index': false
        },
        {
          'name': 'timestamp'
          'type': 'i64'
          'index': false
        },
      ]
    },
    {
      'name': 'RegisterUserEvent'
      'fields': [
        {
          'name': 'pool'
          'type': 'publicKey'
          'index': true
        },
        {
          'name': 'user'
          'type': 'publicKey'
          'index': true
        },
      ]
    },
    {
      'name': 'MintPoolTokensEvent'
      'fields': [
        {
          'name': 'pool'
          'type': 'publicKey'
          'index': true
        },
        {
          'name': 'user'
          'type': 'publicKey'
          'index': true
        },
        {
          'name': 'collateral'
          'type': 'publicKey'
          'index': true
        },
        {
          'name': 'amount'
          'type': 'u64'
          'index': false
        },
        {
          'name': 'timestamp'
          'type': 'i64'
          'index': false
        },
      ]
    },
  ]
  'errors': [
    {
      'code': 6000
      'name': 'Unauthorized'
      'msg': 'Unauthorized action'
    },
    {
      'code': 6001
      'name': 'InvalidStakeAccount'
      'msg': 'Invalid stake account'
    },
    {
      'code': 6002
      'name': 'InsufficientAmount'
      'msg': 'Insufficient amount'
    },
    {
      'code': 6003
      'name': 'TypeOverflow'
      'msg': 'Type overflow'
    },
    {
      'code': 6004
      'name': 'PoolAlreadyPaused'
      'msg': 'Pool is already paused'
    },
    {
      'code': 6005
      'name': 'PoolAlreadyResumed'
      'msg': 'Pool is already resumed'
    },
    {
      'code': 6006
      'name': 'UserBlocked'
      'msg': 'User is blocked'
    },
    {
      'code': 6007
      'name': 'UserNotBlocked'
      'msg': 'User is not blocked'
    },
    {
      'code': 6008
      'name': 'WrongData'
      'msg': 'Wrong input data'
    },
  ]
}

export const IDL: Omnisol = {
  version: '0.0.4',
  name: 'omnisol',
  instructions: [
    {
      name: 'initPool',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'poolMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'poolAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'addManager',
      accounts: [
        {
          name: 'pool',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'managerWallet',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'manager',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'removeManager',
      accounts: [
        {
          name: 'pool',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'manager',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'managerWallet',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'pausePool',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'manager',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: 'resumePool',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'manager',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
      ],
      args: [],
    },
    {
      name: 'addToWhitelist',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'addressToWhitelist',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'pool',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'whitelist',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'manager',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'removeFromWhitelist',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'whitelist',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'manager',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'addressToWhitelist',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'blockUser',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'manager',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'userWallet',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'unblockUser',
      accounts: [
        {
          name: 'manager',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'user',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'userWallet',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'closePool',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'depositLp',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'poolAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'collateral',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'source',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'destination',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'whitelist',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'lpToken',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'depositStake',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'poolAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'collateral',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'sourceStake',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'stakeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'mintOmnisol',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'poolMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'poolAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'collateral',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'userPoolToken',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'stakedAddress',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'withdrawLpTokens',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'poolAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'collateral',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'source',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'destination',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'lpToken',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'poolMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'userPoolToken',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'withdrawStake',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'poolAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'user',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'collateral',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'poolMint',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'sourceStake',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'splitStake',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'userPoolToken',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'stakeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'withdrawSol',
      accounts: [
        {
          name: 'pool',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'poolMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'poolAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'sourceTokenAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'clock',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'stakeProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'initOracle',
      accounts: [
        {
          name: 'pool',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'oracle',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'oracleAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'closeOracle',
      accounts: [
        {
          name: 'pool',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'oracle',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'updateOracleInfo',
      accounts: [
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'oracle',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'addresses',
          type: {
            vec: 'publicKey',
          },
        },
        {
          name: 'values',
          type: {
            vec: 'u64',
          },
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'pool',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'poolMint',
            docs: [
              'Pool tokens are issued when assets are deposited.',
            ],
            type: 'publicKey',
          },
          {
            name: 'authority',
            docs: [
              'An account with authority that can manage and close the pool.',
            ],
            type: 'publicKey',
          },
          {
            name: 'depositAmount',
            docs: [
              'Total stake in deposit',
            ],
            type: 'u64',
          },
          {
            name: 'authorityBump',
            docs: [
              'Signer bump seed for deriving PDA seeds',
            ],
            type: 'u8',
          },
          {
            name: 'isActive',
            docs: [
              'Flag that indicates that the pool is running or paused',
            ],
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'oracle',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'authority',
            docs: [
              'Oracle wallet that can manage oracle info',
            ],
            type: 'publicKey',
          },
          {
            name: 'priorityQueue',
            docs: [
              'Priority queue with collaterals by users rate in ascending order',
            ],
            type: {
              vec: {
                defined: 'QueueMember',
              },
            },
          },
        ],
      },
    },
    {
      name: 'collateral',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'user',
            docs: [
              'User PDA with wallet that has authority of the staking pool',
            ],
            type: 'publicKey',
          },
          {
            name: 'pool',
            docs: [
              'Address of the global pool',
            ],
            type: 'publicKey',
          },
          {
            name: 'sourceStake',
            docs: [
              'An account of staking pool or LP token',
            ],
            type: 'publicKey',
          },
          {
            name: 'delegationStake',
            docs: [
              'An amount of delegated staked tokens',
            ],
            type: 'u64',
          },
          {
            name: 'amount',
            docs: [
              'An amount of minted pool tokens',
            ],
            type: 'u64',
          },
          {
            name: 'liquidatedAmount',
            docs: [
              'An amount of "liquidated" staked tokens',
            ],
            type: 'u64',
          },
          {
            name: 'createdAt',
            docs: [
              'Time of collateral\'s creation',
            ],
            type: 'i64',
          },
          {
            name: 'bump',
            docs: [
              'Signer bump seed for deriving PDA seeds',
            ],
            type: 'u8',
          },
          {
            name: 'isNative',
            docs: [
              'Flag that indicates the type of stake (can be LP token account or native staking pool)',
            ],
            type: 'bool',
          },
        ],
      },
    },
    {
      name: 'whitelist',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'whitelistedToken',
            docs: [
              'Token mint address that is whitelisted to the pool',
            ],
            type: 'publicKey',
          },
          {
            name: 'pool',
            docs: [
              'Pool address',
            ],
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'manager',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'manager',
            docs: [
              'Manager wallet address',
            ],
            type: 'publicKey',
          },
        ],
      },
    },
    {
      name: 'user',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'wallet',
            docs: [
              'Wallet of registered user',
            ],
            type: 'publicKey',
          },
          {
            name: 'rate',
            docs: [
              'Rate value for priority queue',
            ],
            type: 'u64',
          },
          {
            name: 'isBlocked',
            docs: [
              'Flag that indicates that the user is blocked or not',
            ],
            type: 'bool',
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'QueueMember',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'collateral',
            type: 'publicKey',
          },
          {
            name: 'amount',
            type: 'u64',
          },
        ],
      },
    },
  ],
  events: [
    {
      name: 'DepositStakeEvent',
      fields: [
        {
          name: 'pool',
          type: 'publicKey',
          index: true,
        },
        {
          name: 'collateral',
          type: 'publicKey',
          index: true,
        },
        {
          name: 'delegationStake',
          type: 'u64',
          index: false,
        },
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
        {
          name: 'timestamp',
          type: 'i64',
          index: false,
        },
      ],
    },
    {
      name: 'WithdrawStakeEvent',
      fields: [
        {
          name: 'pool',
          type: 'publicKey',
          index: true,
        },
        {
          name: 'collateral',
          type: 'publicKey',
          index: true,
        },
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
        {
          name: 'restAmount',
          type: 'u64',
          index: false,
        },
        {
          name: 'timestamp',
          type: 'i64',
          index: false,
        },
      ],
    },
    {
      name: 'WithdrawSolEvent',
      fields: [
        {
          name: 'pool',
          type: 'publicKey',
          index: true,
        },
        {
          name: 'authority',
          type: 'publicKey',
          index: false,
        },
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
        {
          name: 'timestamp',
          type: 'i64',
          index: false,
        },
      ],
    },
    {
      name: 'RegisterUserEvent',
      fields: [
        {
          name: 'pool',
          type: 'publicKey',
          index: true,
        },
        {
          name: 'user',
          type: 'publicKey',
          index: true,
        },
      ],
    },
    {
      name: 'MintPoolTokensEvent',
      fields: [
        {
          name: 'pool',
          type: 'publicKey',
          index: true,
        },
        {
          name: 'user',
          type: 'publicKey',
          index: true,
        },
        {
          name: 'collateral',
          type: 'publicKey',
          index: true,
        },
        {
          name: 'amount',
          type: 'u64',
          index: false,
        },
        {
          name: 'timestamp',
          type: 'i64',
          index: false,
        },
      ],
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'Unauthorized',
      msg: 'Unauthorized action',
    },
    {
      code: 6001,
      name: 'InvalidStakeAccount',
      msg: 'Invalid stake account',
    },
    {
      code: 6002,
      name: 'InsufficientAmount',
      msg: 'Insufficient amount',
    },
    {
      code: 6003,
      name: 'TypeOverflow',
      msg: 'Type overflow',
    },
    {
      code: 6004,
      name: 'PoolAlreadyPaused',
      msg: 'Pool is already paused',
    },
    {
      code: 6005,
      name: 'PoolAlreadyResumed',
      msg: 'Pool is already resumed',
    },
    {
      code: 6006,
      name: 'UserBlocked',
      msg: 'User is blocked',
    },
    {
      code: 6007,
      name: 'UserNotBlocked',
      msg: 'User is not blocked',
    },
    {
      code: 6008,
      name: 'WrongData',
      msg: 'Wrong input data',
    },
  ],
}

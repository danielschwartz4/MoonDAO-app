import { Mumbai } from '@thirdweb-dev/chains'
import {
  MediaRenderer,
  useAddress,
  useContract,
  useNFT,
} from '@thirdweb-dev/react'
import { BigNumber, ethers } from 'ethers'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useContext, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import ChainContext from '../../lib/thirdweb/chain-context'
import { useHandleRead, useHandleWrite } from '../../lib/thirdweb/hooks'
import { initSDK } from '../../lib/thirdweb/thirdweb'
import { useTokenAllowance, useTokenApproval } from '../../lib/tokens/approve'
import { useMerkleProof } from '../../lib/utils/hooks/useMerkleProof'
import Head from '../../components/layout/Head'
import { collectionMetadata } from '../../components/marketplace/assets/seed'
import { PrivyWeb3Button } from '../../components/privy/PrivyWeb3Button'
import ERC20 from '../../const/abis/ERC20.json'
import ttsSweepstakesV2 from '../../const/abis/ttsSweepstakesV2.json'
import { devWhitelist } from '../../const/tts/whitelist'

const TICKET_TO_SPACE_ADDRESS = '0xFB8f14dE03A8edA036783F0b81992Ea7ce7ce8B5' //mumbai

export default function Ticket2Space({ sweepstakesSupply }: any) {
  const { selectedChain, setSelectedChain }: any = useContext(ChainContext)
  const router = useRouter()

  const [state, setState] = useState(0)
  const [time, setTime] = useState<string>()
  const [quantity, setQuantity] = useState(1)
  const [supply, setSupply] = useState(sweepstakesSupply)

  const address = useAddress()

  const whitelist = devWhitelist.split('\n')
  const merkleProof = useMerkleProof(whitelist)
  const { contract: ttsContract } = useContract(
    TICKET_TO_SPACE_ADDRESS,
    ttsSweepstakesV2.abi
  )

  const { data: nft } = useNFT(ttsContract, 1)
  const { contract: mooneyContract } = useContract(
    '0x3818f3273D1f46259b737342Ad30e576A7A74f09',
    ERC20.abi
  ) //mumbai mooney

  const { mutateAsync: approveToken } = useTokenApproval(
    mooneyContract,
    ethers.utils.parseEther(String(100 * quantity)),
    BigNumber.from(0),
    TICKET_TO_SPACE_ADDRESS
  )

  const { data: tokenAllowance } = useTokenAllowance(
    mooneyContract,
    address,
    TICKET_TO_SPACE_ADDRESS
  )

  const { mutateAsync: mint } = useHandleWrite(ttsContract, 'mint', [
    BigNumber.from(quantity || 0),
  ])
  const { mutateAsync: claimFree } = useHandleWrite(ttsContract, 'claimFree', [
    merkleProof,
  ])

  useEffect(() => {
    setSelectedChain(Mumbai)
    setTime(
      new Date().toLocaleDateString() + ' @ ' + new Date().toLocaleTimeString()
    )
  }, [])

  useEffect(() => {
    if (ttsContract) {
      ttsContract
        .call('getSupply')
        .then((supply: any) => setSupply(supply.toString()))
      console.log(supply)
    }
  }, [ttsContract])

  return (
    <main className="animate-fadeIn">
      <Head title="Ticket to Space" />

      <div className="mt-3 px-5 lg:px-7 xl:px-10 py-12 lg:py-14 page-border-and-color font-RobotoMono w-[336px] sm:w-[400px] lg:mt-10 lg:w-full lg:max-w-[1080px] text-slate-950 dark:text-white">
        <h1 className={`page-title`}>Ticket to Space</h1>
        <h3 className="mt-5 lg:mt-8 font-bold text-center lg:text-left text-lg lg:text-xl xl:text-2xl">
          Take the leap, for the chance to win a trip to space!
        </h3>
        {state === 0 && (
          <div className="">
            <p className="mt-5 text-sm lg:mt-6 opacity-70 max-w-2xl lg:max-w-3xl font-RobotoMono text-center lg:text-left lg:text-base xl:text-lg">
              Purchase this NFT and follow us on our journey to randomly select
              an owner to win a trip to space!
            </p>
          </div>
        )}

        {/*Collection title, image and description*/}
        <div className="mt-6 inner-container-background relative w-full xl:w-2/3">
          {collectionMetadata && (
            <div className="flex flex-col bg-transparent p-4 md:p-5 lg:p-6 xl:p-[30px]">
              <h1 className="font-GoodTimes text-2xl lg:text-3xl xl:text- text-moon-orange dark:text-white">
                {'Ticket to Space NFT 2'}
              </h1>
              <div className="my-2 p-2 flex justify-center">
                <MediaRenderer src={nft?.metadata.image} width={'300px'} />
              </div>
              {/*Quantity, price, expiration */}
              <div className="mt-4 lg:mt-5 flex flex-col gap-2 lg:gap-4">
                <div>
                  <p className="opacity-70 lg:text-xl">Quantity left</p>
                  <p className="mt-1 lg:mt-2 font-semibold lg:text-lg">
                    {sweepstakesSupply ? 9060 - +supply : '...loading'}
                  </p>
                </div>

                {/* Pricing information */}
                <div>
                  <p className="opacity-70 lg:text-xl">Price</p>
                  <p className="mt-1 lg:mt-2 font-semibold lg:text-lg">
                    100 MOONEY
                  </p>
                </div>
                {/*Expiration*/}
                <div>
                  <p className="opacity-70 lg:text-xl">Expiration</p>
                  <p className="mt-1 lg:mt-2 font-semibold lg:text-lg">
                    {time}
                  </p>
                </div>
              </div>
              {/*Not definitive, this one is being used on another page*/}
              <div className="mt-4 flex flex-col gap-8">
                <div className="flex gap-4">
                  <PrivyWeb3Button
                    label="Mint"
                    action={async () => {
                      console.log(tokenAllowance)
                      if (tokenAllowance.toString() < 100 * 10 ** 18)
                        await approveToken()
                      toast.success('Approved Mooney to be spent')
                      await mint()
                    }}
                    onSuccess={() => {
                      toast.success('Minted Ticket to Space NFT(s)')
                    }}
                  />
                  <input
                    className="w-1/4 text-center text-black"
                    type="number"
                    step={1}
                    placeholder={'0'}
                    onChange={(e: any) => setQuantity(e.target.value)}
                  />
                </div>
                {whitelist.includes(address || '') && (
                  <div>
                    <PrivyWeb3Button label="Claim Free" action={claimFree} />
                    <p>
                      If you've entered the previous ticket to space
                      sweepstakes, claim a ticket for free!
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export async function getServerSideProps() {
  const sdk = initSDK(Mumbai)

  const ticketToSpaceContract = await sdk.getContract(
    TICKET_TO_SPACE_ADDRESS,
    ttsSweepstakesV2.abi
  )
  const sweepstakesSupply = await ticketToSpaceContract?.call('getSupply')

  return {
    props: {
      sweepstakesSupply: sweepstakesSupply.toString(),
    },
  }
}

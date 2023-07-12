import * as React from 'react'

import idl from './idl/postfeedapp.json'
import tagStyled from 'styled-components'

import * as anchor from "@project-serum/anchor";
import {Buffer} from 'buffer';
import { Connection, PublicKey, clusterApiUrl  } from '@solana/web3.js';
import { Program, AnchorProvider, web3, utils } from '@project-serum/anchor';
import LoadingImage from './assets/loader-unscreen.gif'
import SinglePost from './SinglePost';
import Masonry from 'react-masonry-css'
import CreatePost from './CreatePost';

const { SystemProgram, Keypair } = web3;

window.Buffer = Buffer
const programID = new PublicKey(idl.metadata.address)
const network = clusterApiUrl("testnet")
const opts = {
  preflightCommitment:"processed",
}
const feedPostApp = Keypair.generate();
const connection = new Connection(network, opts.preflightCommitment);

const breakpointColumnsObj = {
  default: 4,
  1150: 3,
  850: 2,
  580: 1
}

const App = () => {
  const [walletAddress, setWalletAddress] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [posts, setPosts] = React.useState(null)
  const { solana } = window;

  const getProvider = () => {
     //Creating a provider, the provider is authenication connection to solana
     const connection = new Connection(network, opts.preflightCommitment);
     const provider = new AnchorProvider(
       connection,
       window.solana,
       opts.preflightCommitment
     );
     return provider;
  }

  const checkIfWalletIsConnected = async () => {
    const { solana } = window

    try {
      setLoading(true)

      if(solana && solana?.isPhantom) {
        const response = await solana.connect({
          onlyIfTrusted : true
        })

        setWalletAddress(response.publicKey.toString())
      }
    } catch(err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const connectWallet = async () => {
    const { solana } = window

    try {
      setLoading(true)

      if(solana) {
        const response = await solana.connect({
          onlyIfTrusted : true
        })

        setWalletAddress(response.publicKey.toString())
      }
    } catch(err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  const onLoad = () => {
    checkIfWalletIsConnected()
    getPosts()
  }

  const createPost  = async (postText, hashTagText, position) => {
    const provider = getProvider() //checks & verify the dapp it can able to connect solana network
    const program = new Program(idl,programID,provider) //program will communicate to solana network via rpc using lib.json as model
    const num = new anchor.BN(position); //to pass number into the smartcontract need to convert into binary
    try {
      //post request will verify the lib.json and using metadata address it will verify the programID and create the block in solana
      await program.rpc.createPost(postText, hashTagText, num, false,{ 
        accounts:{
          feedPostApp:feedPostApp.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers:[feedPostApp] 
      })
      //const account_data  = await program.account.feedPostApp.fetch(feedPostApp.publicKey)
      //console.log('user_data',user_data,'tx',tx,'feedpostapp',feedPostApp.publicKey.toString(),'user',provider.wallet.publicKey.toString(),'systemProgram',SystemProgram.programId.toString())
      onLoad();
    } catch(err){
      console.log(err)
    }
  }

  const getPosts = async() =>{
    const provider = getProvider();
    const program = new Program(idl, programID, provider)
    try{
      setLoading(true)
      Promise.all(
        ((
            await connection.getProgramAccounts(programID)).map( async(tx) => ( 
            //no need to write smartcontract to get the data, just pulling all transaction respective programID and showing to user
            {
              ...(await program.account.feedPostApp.fetch(tx.pubkey)),
                pubkey:tx.pubkey.toString(),
            }
        )))
      ).then( result => {
        result.sort(function(a,b){return b.position.words[0] - a.position.words[0] })
        setPosts([...result])
      })
    } catch(err) {
      console.log(err)
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);


  return (
    <AppLayout>
      <Header>
        🍭 Post Feed 
        { walletAddress ? <>
          <Button>{walletAddress.slice(0, 4)}...{walletAddress.slice(walletAddress.length -  4 , walletAddress.length)}</Button>
        </>
        : <Button onClick={connectWallet}>Connect</Button> }
      </Header>
      <CreatePost 
        createPost={createPost}
        posts={posts}
      />
      
        { posts ?
          posts.length ? <Masonry
            breakpointCols={breakpointColumnsObj}
            className='post_list'
            columnClassName='post_list_column'
          >
          { posts.map((post, index) => (
            <SinglePost 
              key={index}
              post={post}
            />
          )) }
          </Masonry>: <></> : <Loading>
          <img src={LoadingImage} />
          </Loading> }
      
    </AppLayout>
  )
}

export default App

const AppLayout = tagStyled.div`
  display: flex;
  flex-direction: column;

  width: 100vw;
  height: 100vh;

  overflow: hidden;

  background: black;
  color: white;

  & .post_list {
    display: -webkit-box; /* Not needed if autoprefixing */
    display: -ms-flexbox; /* Not needed if autoprefixing */
    display: flex;
    margin-left: -20px; /* gutter size offset */
    width: auto;
  }

  & .post_list_column {
    padding-left: 20px; /* gutter size */
    background-clip: padding-box;
    display: flex;
    justify-content: center;
  }
`
const Loading = tagStyled.div`
  display: flex;
  justify-content: center;
`
const Header = tagStyled.p`
  font-size: 2rem;
  font-weight: bold;
  display: flex;
  gap: 30px;
  justify-content: flex-end;
  padding-right : 2rem;
`

export const Button = tagStyled.button`
  color: white;
  background: -webkit-linear-gradient(left, #ff8867, #ff52ff);
  background-size: 200% 200%;
  animation: gradient-animation 4s ease infinite;

  height: 45px;
  border: 0;
  width: auto;
  padding-left: 40px;
  padding-right: 40px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
`
import React, { Component, useCallback, useEffect, useState } from 'react';
import Web3 from 'web3';
import Identicon from 'identicon.js';
import './App.css';
import Decentragram from '../abis/Decentragram.json'
import Navbar from './Navbar'
import Main from './Main'
import ipfsClient from 'ipfs-http-client';

const ipfs = ipfsClient({host: 'ipfs.infura.io', port: 5001, protocol: 'https'})
const App = () => {
  const loadWeb3 = async () => {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum)
      await window.ethereum.enable()
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider)
    } else {
      window.alert('Non ethereum browser detected. You should consider trying Metamask!')
    }
  }
  const loadBlockchainData = async () => {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts()
    setState({ account: accounts[0]})

    const networkId = await web3.eth.net.getId();
    const networkData = Decentragram.networks[networkId];
    if (networkData) {
      const decentragram = web3.eth.Contract(Decentragram.abi, networkData.address)
      setState({decentragram});
      const imagesCount = await decentragram.methods.imageCount().call();
      setState({images: imagesCount, loading: false})

    } else {
      window.alert('Decentragram contract not deployed to detected network')
    }
  };

  const captureFile = useCallback((event) => {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);

    reader.onloadend = () => {
      setState({buffer: Buffer(reader.result)});
    }
  });

  const uploadImage = useCallback((description) => {
    ipfs.add(state.buffer, (err, result) => {
      if (err) {
        console.err(err);
        return
      }
      setState({loading: true});
      state.decentragram.methods.uploadImage(result[0].hash, description)
        .send({ from: state.account})
        .on('transactionHash', (hash) => {
          setState({ loading: false })
      });
    });
  })

  useEffect(() => {
    loadWeb3();
    loadBlockchainData();
  }, []);

  const initialState = {
    account: '',
    decentragram: null,
    images: [],
    buffer: null,
    loading: true,
  }

  const [state, setState] = useState(initialState);

    return (
      <div>
        <Navbar account={state.account} />
        {state.loading
          ? <div id="loader" className="text-center mt-5"><p>Loading...</p></div>
          : <Main
               captureFile={captureFile}
               uploadImage={uploadImage}
            />
          }
      </div>
    );
  }

export default App;
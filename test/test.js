const Decentragram = artifacts.require('./Decentragram.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Decentragram', ([deployer, author, tipper]) => {
  let decentragram
  const testhash = 'zckjbkhsbdhka3';

  before(async () => {
    decentragram = await Decentragram.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await decentragram.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await decentragram.name()
      assert.equal(name, 'Decentragram')
    })
  })

  describe('images', async () => {
    let result, imageCount;

    before(async () => {
      result = await decentragram.uploadImage(testhash, 'Image description', {from: author})
      imageCount = await decentragram.imageCount();
    })
    it('create images', async () => {
      assert.equal(imageCount, 1)
      const event = result.logs[0].args;
      const {id, hash, description, tipAmount} = event;

      assert.equal(id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(hash, testhash, 'hash is correct')
      assert.equal(description, 'Image description', 'description is correct')
      assert.equal(tipAmount, 0, 'tip amount is correct')
      assert.equal(event.author, author, 'author is correct')

      await decentragram.uploadImage('', 'Image desctiption', {from: author}).should.be.rejected;
      await decentragram.uploadImage(testhash, '', {from: author}).should.be.rejected;
      await decentragram.uploadImage(testhash, 'Image description', {from: 0x0}).should.be.rejected;
    })

    it('list images', async () => {
      const event = await decentragram.images(imageCount);
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct');
      assert.equal(event.hash, testhash, 'hash is correct');
      assert.equal(event.description, 'Image description', 'description is correct');
      assert.equal(event.tipAmount, 0, 'tip is correct');
      assert.equal(event.author, author, 'author is correct');
    })

    it('allows users to tip images', async () => {
      // Track the author balance before purchase
      let oldAuthorBalance
      oldAuthorBalance = await web3.eth.getBalance(author)
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)

      result = await decentragram.tipImageOwner(imageCount, { from: tipper, value: web3.utils.toWei('1', 'Ether') })

      // SUCCESS
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, testhash, 'Hash is correct')
      assert.equal(event.description, 'Image description', 'description is correct')
      assert.equal(event.tipAmount, '1000000000000000000', 'tip amount is correct')
      assert.equal(event.author, author, 'author is correct')

      // Check that author received funds
      let newAuthorBalance
      newAuthorBalance = await web3.eth.getBalance(author)
      newAuthorBalance = new web3.utils.BN(newAuthorBalance)

      let tipImageOwner
      tipImageOwner = web3.utils.toWei('1', 'Ether')
      tipImageOwner = new web3.utils.BN(tipImageOwner)

      const expectedBalance = oldAuthorBalance.add(tipImageOwner)

      assert.equal(newAuthorBalance.toString(), expectedBalance.toString())

      // FAILURE: Tries to tip a image that does not exist
      await decentragram.tipImageOwner(99, { from: tipper, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
    })
  })
})
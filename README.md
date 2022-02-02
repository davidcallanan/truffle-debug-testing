
Patch "@truffle/debug/dist/debugger.js":

```
// let t=await(0,Ln.promisify)(this.web3.currentProvider.send)(
let provider = this.web3.currentProvider;
let t=await(0,Ln.promisify)(provider.send.bind(provider))(
```

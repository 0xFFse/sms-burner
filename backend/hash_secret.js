const bcrypt = require('bcryptjs');
const readline = require('readline');

var rl = readline.createInterface({
    input: process.stdin,
    output: null,
    terminal: false
  });
  
rl.on('line', function(line){
    console.log('\nHash: '+bcrypt.hashSync(line));
    process.exit(0);
})

process.stdout.write('Password: ');
process.stdin.setRawMode(true);


const rewire = require('rewire');
const mocha = require('mocha');
const should = require('should');

const app = rewire('../index.js');

describe('SMS parsing', () => {
    it('should decode concatinated message', function(done) {
        var decode = app.__get__('decode');
        var msg = decode("07916407970900F2600BD0C377DB9E8E03000091309221743340A0050003B602019065750884DCCB41EB77BB5D9683C8653768DA9CB6D66F32885C07CDD76150D86DDFBBC96190992F0785E974107B7F3E8741F4349B0D22A7E974903B1F06B9EBED76590E823F40E4349D0E5ABFDDF4B70E44379BDD6EBC4BF16C83C87550DA4D2F83D06139485C9ED3F76C361DE47E9CDF6ED0FA4D06ADC36E10B90E12BFE5F4791964963FDC");
        should.not.exist(msg);
        should.equal(app.__get__('pendingMessages').size, 1);

        //decode an ordinary message just to check that it doesn't interfere
        msg = decode("07916407970900F22409D0D432BB2C030000913092218412401DC4B41B642FCBD3E674599E769FE7EB3719B49783DCEBDCBCBD06");
        should.exist(msg);
        should.equal(app.__get__('pendingMessages').size, 1);

        msg = decode("07916407970900F2640BD0C377DB9E8E0300009130922174334029050003B6020240E4321D84DECB41D3E65457A6BB40C83D7BEE4EBBCF613968F86EDBD371");
        should.exist(msg);
        const msgText = "Hej! Här kommer den SMS-kod du ska använda för att lägga till ditt nya nummer på ditt konto: tffnnx.\nOm du inte har beställt någon kod kan du bortse från det här SMS:et. Hälsningar Comviq";
        should.equal(msg.getData().getText(), msgText)
        should.equal(app.__get__('pendingMessages').size, 0);

        done();
    });    

    it('should decode concatinated message out of order', function(done) {
        var decode = app.__get__('decode');
        var msg = decode("07916407970900F2640BD0C377DB9E8E0300009130922174334029050003B6020240E4321D84DECB41D3E65457A6BB40C83D7BEE4EBBCF613968F86EDBD371");
        should.not.exist(msg);
        should.equal(app.__get__('pendingMessages').size, 1);

        msg = decode("07916407970900F2600BD0C377DB9E8E03000091309221743340A0050003B602019065750884DCCB41EB77BB5D9683C8653768DA9CB6D66F32885C07CDD76150D86DDFBBC96190992F0785E974107B7F3E8741F4349B0D22A7E974903B1F06B9EBED76590E823F40E4349D0E5ABFDDF4B70E44379BDD6EBC4BF16C83C87550DA4D2F83D06139485C9ED3F76C361DE47E9CDF6ED0FA4D06ADC36E10B90E12BFE5F4791964963FDC");
        should.exist(msg);
        const msgText = "Hej! Här kommer den SMS-kod du ska använda för att lägga till ditt nya nummer på ditt konto: tffnnx.\nOm du inte har beställt någon kod kan du bortse från det här SMS:et. Hälsningar Comviq";
        should.equal(msg.getData().getText(), msgText)
        should.equal(app.__get__('pendingMessages').size, 0);

        done();
    });    

});

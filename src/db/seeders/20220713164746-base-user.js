'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Users', [{
      id: 1,
      username: 'admin',
      password: bcrypt.hashSync('admin', 10),
      role: 'admin'
    }, {
      id: 2,
      username: 'scraping',
      password: bcrypt.hashSync('scraping', 10),
      role: 'admin'
    }, {
      id: 3,
      username: 'jzillinger',
      email: 'joeyzillinger@gmail.com',
      phoneNumber: '+33611180634',
      firstName: 'Joey',
      lastName: 'Zillinger',
      showName: 'Joey Zillinger',
      localisation: 'Paris, France',
      profilImage: '/image/users/profilImages/jzillinger_1655584030052D.jpg',
      coverImage: '/image/users/coverImages/jzillinger_1655584238142D.jpg',
      userGoogleId: '109509703384856802041',
      password: bcrypt.hashSync('jzillinger', 10),
      role: 'admin'
    }, {
      id: 4,
      username: 'ybenamor',
      email: 'benamoyoussef@gmail.com',
      phoneNumber: '+33645437176',
      firstName: 'Youssef',
      lastName: 'Ben Amor',
      showName: 'Youssef Ben Amor',
      password: bcrypt.hashSync('ybenamor', 10),
      role: 'admin'
    }, {
      id: 5,
      username: 'qbekkai',
      email: 'quentinbekkai@gmail.com',
      phoneNumber: '+33615183111',
      firstName: 'Quentin',
      lastName: 'BEKKAÏ',
      showName: 'Quentin BEKKAÏ',
      userGoogleId: '108073920622574758872',
      userAppleId: '000394.7a869adc7ee2412eb90ca5cac6de35aa.0924',
      password: bcrypt.hashSync('qbekkai', 10),
      role: 'admin'
    }, {
      id: 6,
      username: 'mmorgand',
      email: 'morgand.mickael@gmail.com',
      phoneNumber: '+33663910888',
      firstName: 'Mickaël',
      lastName: 'Morgand',
      showName: 'Mickaël Morgand',
      profilImage: 'https://lh3.googleusercontent.com/a-/AOh14GhsZ674goidO62oQuNGKxCeDZsTOBZr6KqdoPA5gw=s96-c',
      localisation: 'Paris',
      userGoogleId: '110923108278550944359',
      role: 'admin'
    }, {
      id: 7,
      username: 'kdaniel',
      email: 'kylian.daniel98@gmail.com',
      firstName: 'Kylian',
      lastName: 'DANIEL',
      showName: 'Kylian DANIEL',
      profilImage: 'https://lh3.googleusercontent.com/a/AATXAJwHJhXoru9MAeTP2_35N3ic1Sr7DVaqjxaqU_Ak=s96-c',
      localisation: 'Paris',
      userGoogleId: '105351980595130144192',
      role: 'admin'
    }], {});

    await queryInterface.bulkInsert('Collections', [
      { UserId: 1 },
      { UserId: 2 },
      { UserId: 3 },
      { UserId: 4 },
      { UserId: 5 },
      { UserId: 6 },
      { UserId: 7 },
    ], {});

    await queryInterface.bulkInsert('Wishlists', [
      { UserId: 1 },
      { UserId: 2 },
      { UserId: 3 },
      { UserId: 4 },
      { UserId: 5 },
      { UserId: 6 },
      { UserId: 7 },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Collections', null, {});
    await queryInterface.bulkDelete('Wishlists', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};

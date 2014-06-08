var expect = require('chai').expect;

describe('i18next-transform', function () {
  var I18NextTransform = require('../src');

  describe('I18NextTransform', function () {

    it('should scan for t(...) calls by default', function (done) {
      var stream = new I18NextTransform();
      stream.end('i18n.t("key") && i18n("anotherKey")', function () {
        expect(stream.read()).to.be.deep.equal({key: ''});
        done();
      });
    });

    it('should respect nesting', function (done) {
      var stream = new I18NextTransform();
      stream.end('i18n.t("key.nestedKey")', function () {
        expect(stream.read()).to.be.deep.equal({key: {nestedKey: ''}});
        done();
      });
    });

    it('should preserve plural forms', function (done) {
      var stream = new I18NextTransform({resource: {key: 'v', key_plural: 'v_plural'}});
      stream.end('i18n.t("key")', function () {
        expect(stream.read()).to.be.deep.equal({key: 'v', key_plural: 'v_plural'});
        done();
      });
    });

    it('should preserve contexts', function (done) {
      var stream = new I18NextTransform({resource: {key: 'v', key_male: 'v_male'}});
      stream.end('i18n.t("key") && i18n.t("key_female")', function () {
        expect(stream.read()).to.be.deep.equal({key: 'v', key_male: 'v_male', key_female: ''});
        done();
      });
    });

  });

});
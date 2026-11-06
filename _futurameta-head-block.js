/**
 * Снимок контроллера FuturaMeta из Site settings → Custom code → Head,
 * снят с живого сайта 06.11.2026. Здесь он лежит только ради проверок:
 * тесту нужен настоящий второй владелец пикселя, а не его пересказ.
 *
 * ⚠️ Это копия. Правится оригинал в Webflow, сюда снимается заново.
 */
(function(w,d){
  'use strict';
  if(w.FuturaMeta)return;
  var ID='1249807613110031', loaded=false, granted=false, pageView=false, conflict=false;
  var owned=null;
  function allowed(){return !!(w.FuturaConsent && w.FuturaConsent.advertisingAllowed());}
  function revoke(){
    granted=false;
    if(owned && w.fbq===owned){
      // A revoked choice must not leave queued PageView/Lead calls to fire later.
      if(Array.isArray(owned.queue))owned.queue=owned.queue.filter(function(args){return args[0]!=='track' && args[0]!=='trackSingle' && args[0]!=='trackCustom' && args[0]!=='trackSingleCustom';});
      owned('consent','revoke');
    }
  }
  function start(){
    if(!allowed())return false;
    if(!loaded){
      // Existing installations must be reconciled, not initialized or tracked twice.
      if(w.fbq || d.querySelector('script[src*="connect.facebook.net"][src*="fbevents.js"]')){conflict=true;return false;}
      var f=w.fbq=function(){f.callMethod?f.callMethod.apply(f,arguments):f.queue.push(arguments);};
      owned=f;if(!w._fbq)w._fbq=f;f.push=f;f.loaded=true;f.version='2.0';f.queue=[];
      f('consent','revoke');f('set','autoConfig',false,ID);f('init',ID);
      loaded=true;
      var s=d.createElement('script');s.id='futura-meta-pixel';s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';
      d.head.appendChild(s);
    }
    if(w.fbq!==owned){conflict=true;return false;}
    if(!granted){owned('consent','grant');granted=true;}
    if(!pageView){owned('trackSingle',ID,'PageView');pageView=true;}
    return true;
  }
  function sync(){if(allowed())start();else revoke();}
  w.FuturaMeta={
    version:'2026-11-04.1',
    status:function(){return {pixelId:ID,loaded:loaded,consent:allowed(),conflict:conflict};},
    webinarLead:function(){
      if(!allowed() || !start())return false;
      owned('trackSingle',ID,'Lead',{content_name:'Webinar registration',content_category:'webinar'});
      return true;
    }
  };
  d.addEventListener('futura:consent',sync);sync();
})(window,document);

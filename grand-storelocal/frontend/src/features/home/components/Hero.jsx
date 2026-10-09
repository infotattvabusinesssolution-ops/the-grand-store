import HeroDesktop from './HeroDesktop';
import HeroMobile from './HeroMobile';

export default function Hero() {
  return (
    <div id="top">
      <div className="hidden md:block">
        <HeroDesktop />
      </div>
      <div className="block md:hidden">
        <HeroMobile />
      </div>
    </div>
  );
}

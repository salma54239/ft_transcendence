import React from 'react';
import './Banner.css';

import Image from '../images/banner.jpg';

const Banner = () => {
  return (
    <div className="banner">
      <img src={Image} alt="Banner" className="banner-image" />
    </div>
  );
};

export default Banner;

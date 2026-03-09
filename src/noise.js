// JS-side Simplex 3D noise -- extracted exactly from prototype
const Noise = (() => {
  const F3 = 1/3, G3 = 1/6;
  const grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  const p = [];
  for (let i = 0; i < 256; i++) p[i] = (Math.random() * 256) | 0;
  const perm = new Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  function dot3(g, x, y, z) { return g[0]*x + g[1]*y + g[2]*z; }
  function simplex3(x, y, z) {
    let s=(x+y+z)*F3;let i=Math.floor(x+s),j=Math.floor(y+s),k=Math.floor(z+s);let t=(i+j+k)*G3;
    let X0=i-t,Y0=j-t,Z0=k-t;let x0=x-X0,y0=y-Y0,z0=z-Z0;let i1,j1,k1,i2,j2,k2;
    if(x0>=y0){if(y0>=z0){i1=1;j1=0;k1=0;i2=1;j2=1;k2=0;}else if(x0>=z0){i1=1;j1=0;k1=0;i2=1;j2=0;k2=1;}else{i1=0;j1=0;k1=1;i2=1;j2=0;k2=1;}}
    else{if(y0<z0){i1=0;j1=0;k1=1;i2=0;j2=1;k2=1;}else if(x0<z0){i1=0;j1=1;k1=0;i2=0;j2=1;k2=1;}else{i1=0;j1=1;k1=0;i2=1;j2=1;k2=0;}}
    let x1=x0-i1+G3,y1=y0-j1+G3,z1=z0-k1+G3;let x2=x0-i2+2*G3,y2=y0-j2+2*G3,z2=z0-k2+2*G3;
    let x3=x0-1+3*G3,y3=y0-1+3*G3,z3=z0-1+3*G3;let ii=i&255,jj=j&255,kk=k&255;let n0=0,n1=0,n2=0,n3=0;
    let t0=0.6-x0*x0-y0*y0-z0*z0;if(t0>0){t0*=t0;n0=t0*t0*dot3(grad3[perm[ii+perm[jj+perm[kk]]]%12],x0,y0,z0);}
    let t1=0.6-x1*x1-y1*y1-z1*z1;if(t1>0){t1*=t1;n1=t1*t1*dot3(grad3[perm[ii+i1+perm[jj+j1+perm[kk+k1]]]%12],x1,y1,z1);}
    let t2=0.6-x2*x2-y2*y2-z2*z2;if(t2>0){t2*=t2;n2=t2*t2*dot3(grad3[perm[ii+i2+perm[jj+j2+perm[kk+k2]]]%12],x2,y2,z2);}
    let t3=0.6-x3*x3-y3*y3-z3*z3;if(t3>0){t3*=t3;n3=t3*t3*dot3(grad3[perm[ii+1+perm[jj+1+perm[kk+1]]]%12],x3,y3,z3);}
    return 32*(n0+n1+n2+n3);
  }
  return { simplex3 };
})();

export default Noise;

#ifndef MSET_DEPTH_BLUR_SH
#define	MSET_DEPTH_BLUR_SH

USE_TEXTURE2D(tBlurSource);
USE_TEXTURE2D(tDepthSource);

uniform vec2	uSourceSize;	// { 1/w, 1/h }

#ifndef DepthBlur_Type
	#define DepthBlur_Type		vec4
#endif

#ifndef	DepthBlur_Swizzle
	#define DepthBlur_Swizzle	xyzw
#endif

#ifndef	DepthBlur_Radius
	#define DepthBlur_Radius	3
#endif

DepthBlur_Type	DepthBlur( vec2 center, DepthBlur_Type backgroundVal )
{
	float centerDepth = texture2D( tDepthSource, center ).x;
	DepthBlur_Type r = backgroundVal;

	HINT_BRANCH
	if( centerDepth > -1.0e10 )
	{
		r *= 0.0;
		float weight = 0.0;
		HINT_UNROLL
		for( int i=-DepthBlur_Radius; i<=DepthBlur_Radius; ++i )
		{
			HINT_UNROLL
			for( int j=-DepthBlur_Radius; j<=DepthBlur_Radius; ++j )
			{
				//coords
				vec2 o = vec2( float(i), float(j) );
				vec2 coord = center + o*uSourceSize;
			
				//sample depth and mask accordingly
				float d = texture2DLod( tDepthSource, coord, 0.0 ).x;
				float w = exp2( -0.8/float(DepthBlur_Radius) * dot(o,o) );
				w = abs(d - centerDepth) < 0.02*abs(centerDepth) ? w : 0.0;

				//sample color
				DepthBlur_Type c = texture2DLod( tBlurSource, coord, 0.0 ).DepthBlur_Swizzle;
				
			#ifdef	DepthBlur_ToneMap
				//HDR tone mapping to prevent blowout
				float ci = max( max( c.x, c.y ), c.z );
				ci = rcp( max(1.0,ci*0.5) );
				w *= ci;
			#endif
				
				//accumulate
				r += w * c;
				weight += w;
			}
		}
		r /= weight;
	}

	return r;
}

#endif
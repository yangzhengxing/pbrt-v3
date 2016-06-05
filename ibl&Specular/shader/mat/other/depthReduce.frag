USE_TEXTURE2D(tInput);

uniform vec2	uBlockSize;
uniform vec4	uSampleScaleBias;

BEGIN_PARAMS
	INPUT0(vec2,fCoord)

	OUTPUT_COLOR0(vec2)
END_PARAMS
{
	vec2 r = vec2( 1.0e12, -1.0e12 );

	#ifdef TEXTURE_GATHER
		//use gather4 sampling, 4x fewer texture lookups
		for( float i=0.0; i<uBlockSize.x; i+=2.0 )
		{
			for( float j=0.0; j<uBlockSize.y; j+=2.0 )
			{
				vec2 o = vec2(i+0.5,j+0.5) * uSampleScaleBias.xy + uSampleScaleBias.zw;
				vec4 d = textureGather( tInput, fCoord + o );
				vec2 mn = min( d.xy, d.zw );
				r.x = min( r.x, min( mn.x, mn.y ) );
				vec2 mx = max( d.xy, d.zw );
				r.y = max( r.y, max( mx.x, mx.y ) );
			}
		}
	#else
		//regular lookups
		for( float i=0.0; i<uBlockSize.x; i+=1.0 )
		{
			for( float j=0.0; j<uBlockSize.y; j+=1.0 )
			{
				vec2 o = vec2(i,j) * uSampleScaleBias.xy + uSampleScaleBias.zw;
				float d = texture2DLod( tInput, fCoord + o, 0.0 ).x;
				r.x = min( r.x, d );
				r.y = max( r.y, d );
			}
		}
	#endif

	//pad it a bit, ~15%,
	//this helps with corner cases when combined w/ linear filtering
	float avg = 0.5*(r.x + r.y);
	r += (r-vec2(avg,avg))*0.15;

	OUT_COLOR0.xy = r;
}
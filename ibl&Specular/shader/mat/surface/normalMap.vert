#include "data/shader/mat/state.vert"

uniform vec3	uNormalMapObjectSpace;	//{ os ? 0 : 1, os ? 1 : 0, 0 }

void	SurfaceNormalMap( inout VertexState s )
{
	//just object space switch
	s.tangent = s.tangent * uNormalMapObjectSpace.x + uNormalMapObjectSpace.yzz;
	s.bitangent = s.bitangent * uNormalMapObjectSpace.x + uNormalMapObjectSpace.zyz;
	s.normal = s.normal * uNormalMapObjectSpace.x + uNormalMapObjectSpace.zzy;
}

#define	Surface	SurfaceNormalMap
/** 
 * Geometry manage array and primitives to draw a geometry.
 * @class Geometry
 */
osg.Geometry = function () {
    osg.Node.call(this);
    this.primitives = [];
    this.attributes = {};
    this.boundingBox = new osg.BoundingBox();
    this.boundingBoxComputed = false;
    this.cacheAttributeList = {};
};

/** @lends osg.Geometry.prototype */
osg.Geometry.prototype = osg.objectInehrit(osg.Node.prototype, {
    dirtyBound: function() {
        if (this.boundingBoxComputed === true) {
            this.boundingBoxComputed = false;
        }
        osg.Node.dirtyBound.call(this);
    },

    dirty: function() {
        this.cacheAttributeList = {};
    },
    getPrimitives: function() { return this.primitives; },
    getAttributes: function() { return this.attributes; },
    getVertexAttributeList: function() { return this.attributes; },
    getPrimitiveSetList: function() { return this.primitives; },

    drawImplementation: function(state) {
        var program = state.getLastProgramApplied();
        var prgID = program.instanceID;
        if (this.cacheAttributeList[prgID] === undefined) {
            var attribute;
            var attributesCache = program.attributesCache;
            var attributeList = [];

            var generated = "//generated by Geometry::implementation\nfunction(state) {\n";
            generated += "state.lazyDisablingOfVertexAttributes();\n";

            for (var i = 0, l = attributesCache.attributeKeys.length; i < l; i++) {
                var key = attributesCache.attributeKeys[i];
                attribute = attributesCache[key];
                var attr = this.attributes[key];
                if (attr === undefined) {
                    continue;
                }
                attributeList.push(attribute);
                generated += "state.setVertexAttribArray(" + attribute + ", this.attributes[\""+key+ "\"], false);\n";
            }
            generated += "state.applyDisablingOfVertexAttributes();\n";
            var primitives = this.primitives;
            generated += "var primitives = this.primitives;\n";
            for (var j = 0, m = primitives.length; j < m; ++j) {
                generated += "primitives["+j+"].draw(state);\n";
            }
            generated += "}";
            var returnFunction = function() {
                //osg.log(generated);
                eval("var drawImplementationAutogenerated = " + generated + ";");
                return drawImplementationAutogenerated;
            };
            this.cacheAttributeList[prgID] = returnFunction();
        }
        this.cacheAttributeList[prgID].call(this, state);
    },

    // for testing disabling drawing
    drawImplementationDummy: function(state) {
        var program = state.getLastProgramApplied();
        var attribute;
        var attributeList = [];
        var attributesCache = program.attributesCache;


        var primitives = this.primitives;
        //state.disableVertexAttribsExcept(attributeList);

        for (var j = 0, m = primitives.length; j < m; ++j) {
            //primitives[j].draw(state);
        }
    },

    getBoundingBox: function() {
        if(!this.boundingBoxComputed) {
            this.computeBoundingBox(this.boundingBox);
            this.boundingBoxComputed = true;
        }
        return this.boundingBox;
    },
    computeBoundingBox: function(boundingBox) {
	var att = this.getAttributes();
	if ( att.Vertex.itemSize == 3 ) {
	    vertexes = att.Vertex.getElements();
	    for (var idx = 0, l = vertexes.length; idx < l; idx+=3) {
		var v=[vertexes[idx],vertexes[idx+1],vertexes[idx+2]];
		boundingBox.expandByVec3(v);
	    }
	}
        return boundingBox;
    },

    computeBound: function (boundingSphere) {
	boundingSphere.init();
	var bb = this.getBoundingBox();
	boundingSphere.expandByBox(bb);
	return boundingSphere;
    }
});
osg.Geometry.prototype.objectType = osg.objectType.generate("Geometry");

/*
Copyright 2011 Sacha Berger

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
(function(){
	function TRACE/**/(/*varargs*/) {
		//w/o trace sym. the code has "TR4CE("
		//replaced by "//TR4CE("
		console.log.apply(null,arguments);
	}

	function Scope(outerScope,symbols,result) {
		this.outerScope=outerScope;
		this.symbols={};
		if(symbols!==undefined)
			for(var k in symbols)
				this.symbols[k]=symbols[k];
		if(result!==undefined) this._=result;
		else this._=undefined;
		this.setResult = function(value) {
			//TRACE("set result",value,"in",this);
			this._=value;
		};
		this.getResult = function() {
			//TRACE("get result",this._,"in",this);
			return this._;
		};
		this.set = function(name,value) {
			//TRACE("set",name,"to",value,"in",this);
			if(this.symbols[name] !== undefined) {
				console.error(name,"already set on",this);
				throw name+" already set on "+this
			}
			this.symbols[name]=value;
		};
		this.get = function(name) {
			//TRACE("get ",name,"in",this);
			if(name in this.symbols) return this.symbols[name];
			else if(this.outerScope){
				try {
					return this.outerScope.get(name);
				} catch(e) {
					console.error(e,this);	
					throw e
				}
			}
			else {
				throw "Variable "+name+" not declared.";
			}
		};
	}

	function Term(impl) {
		this.calc = impl;
	}

	function VAL(primitiveValue) {
		return new Term(function(scope,continuation) {
			//TRACE("VAL",primitiveValue);
			scope.setResult(primitiveValue);
			continuation[0].calc(scope,continuation.slice(1));
		});
	}

	function FUN(/*varargs,closure*/){
		var args = Array.apply(null,arguments);
		var splt = args.length-1;
		var closure = args[splt];
		var formalParams = args.slice(0,splt);
		//TRACE("ARGS",formalParams,closure);
		return function(/*varargs*/) {
			var args = Array.apply(null,arguments);
			//TRACE("CALLING FUN",args);
			var toDos = formalParams.map(function(p,i,fps){
				return LET(p,args[i])
			});
			return DO.apply(null,toDos.concat(closure));
		}
	}

	function CALL(/*fun,varargs*/){
		var args = Array.apply(null,arguments);
		var funName = args[0];
		var params = args.slice(1);
		return new Term(function(scope,continuation) {
			if((typeof funName == "string"))
				scope.get(funName).apply(null,params).calc(scope,continuation);
			else {
				funName.calc(scope,[
					new Term(function(_,fnCont) {
						scope.get(scope.getResult()).apply(null,params).calc(scope,continuation)
					})
				]);
			}				
		})
	}

	function MAP(array,closure) {
		return DO(
			array,
			SYNC(function(scope,chain){
				var res = scope.getResult().map(function(o){
					var branchScope = new Scope(scope.outerScope,scope.symbols,o);
					return branchScope;
				});
				var cnt = res.length;
				res.forEach(function(branchScope,i){
					//TRACE("MAP:branchScope",branchScope,branchScope.getResult());
					closure.calc(branchScope,[new Term(function(w,_){
						res[i]=w;
						cnt--;
						if(cnt==0) {
							scope.setResult(res.map(function(o){
								return o.getResult();
							}));
							chain();									
						}
					})]);							
				});
			})
		)
	}

	function IFELSE(condition,Then,Else){
		return _BLK([
			condition,
			new Term(function(scope,continuation){
				var cndVal = scope.getResult();
				//TRACE("IFELSE:conditionvalue",cndVal);
				if(cndVal) Then.calc(scope,continuation);
				else Else.calc(scope,continuation);
			})
		])
	}

	function _BLK(commands){
		// //TRACE("DEF _BLK",commands);
		if(commands.length == 0) {
			return RUN(function(_){});
		} else {
			return new Term(function(scope,continuation) {
				// //TRACE("_BLK",scope,continuation);
				var tailBlk = _BLK(commands.slice(1));
				commands[0].calc(scope,[tailBlk].concat(continuation));
			})
		}
	}

	function DO(/*varargs*/){
		var args = Array.apply(null,arguments);
		return new Term(function(scope,continuation) {
			_BLK(args).calc(new Scope(scope),[new Term(function(innerScope,_) {
				scope.setResult(innerScope.getResult());
				continuation[0].calc(scope,continuation.slice(1));
			})]);
		})
	}

	function GET(variable) {
		if(typeof variable == "string")
			return RUN(function(scope) {
				return scope.get(variable);
			})
		else
			return _BLK([
				variable,
				RUN(function(scope){
					return scope.get(scope.getResult());
				})
			]);
	}

	function LET(lhs,rhs) {
		return IFELSE(
			RUN(function(scope){
				return typeof lhs == "string"				
			}),
			_BLK([
				rhs,
				RUN(function(scope){
					var value = scope.getResult();
					//TRACE("LET",lhs,"TO",value);
					scope.set(lhs,value);
				})
			]),
			_BLK([
				rhs,
				SYNC(function(scope,chain){
					var value = scope.getResult();
					lhs.calc(new Scope(scope),[
						new Term(function(lhsScope,continuation) {
							//TRACE("LET",lhs,"TO",value);
							scope.set(lhsScope.getResult(),value);
							chain();
						})
					]);
				})
			])
		);
		
	}

	function RUN(procedure) {
		return SYNC(function(scope,chain){
			// //TRACE("RUN",procedure);
			var res = procedure(scope);
			if(res !== undefined)
				scope.setResult(res);
			chain();
		});
	}

	function SYNC(asyncProcedure) {
		return new Term(function(scope,continuation) {
			// //TRACE("SYNC",asyncProcedure);
			asyncProcedure(scope,function(){
				continuation[0].calc(scope,continuation.slice(1));
			});
		})
	}

	function SCRIPT(/*varargs*/) {
		this.script = Array.apply(null,arguments);
		this.callback=function(scope){};
		this.then = function(callback) {
			var res = new SCRIPT();
			res.script=this.script;
			res.callback=callback;
			return res;
		}
		this.execute = function() {
			_BLK(this.script).calc(new Scope(),[new Term(this.callback)]);
		}
	}


	if(! window.sachaberger)
		window.sachaberger={};
	
	if(! window.sachaberger.avaJScript){
		window.sachaberger.avaJScript={
			__version__:"pre_1.0_master-branch",
			VAL: VAL,
			FUN: FUN,
			MAP: MAP,
			DO: DO,
			GET: GET,
			LET: LET,
			RUN: RUN,
			SYNC: SYNC,
			SCRIPT: SCRIPT,
			IFELSE: IFELSE,
			IF: FUN("condition", "then", 
				IFELSE(
					GET("condition"), 
					GET("then"), 
					DO()
				)
			),
			CALL: CALL,
			EQ: FUN("lhs","rhs",RUN(function(scope){
				var lhs = scope.get("lhs"),
				    rhs = scope.get("rhs");
				//TRACE("EQ",lhs,rhs,lhs === rhs);
				return lhs === rhs
			}))
		};
	}
})();




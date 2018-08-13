
/// <reference path="../../../dist/preview release/LIB.d.ts" />
var LIB;
(function (LIB) {
    /**
     * Helper class to push actions to a pool of workers.
     */
    var WorkerPool = /** @class */ (function () {
        /**
         * Constructor
         * @param workers Array of workers to use for actions
         */
        function WorkerPool(workers) {
            this._pendingActions = new Array();
            this._workerInfos = workers.map(function (worker) { return ({
                worker: worker,
                active: false
            }); });
        }
        /**
         * Terminates all workers and clears any pending actions.
         */
        WorkerPool.prototype.dispose = function () {
            for (var _i = 0, _a = this._workerInfos; _i < _a.length; _i++) {
                var workerInfo = _a[_i];
                workerInfo.worker.terminate();
            }
            delete this._workerInfos;
            delete this._pendingActions;
        };
        /**
         * Pushes an action to the worker pool. If all the workers are active, the action will be
         * pended until a worker has completed its action.
         * @param action The action to perform. Call onComplete when the action is complete.
         */
        WorkerPool.prototype.push = function (action) {
            for (var _i = 0, _a = this._workerInfos; _i < _a.length; _i++) {
                var workerInfo = _a[_i];
                if (!workerInfo.active) {
                    this._execute(workerInfo, action);
                    return;
                }
            }
            this._pendingActions.push(action);
        };
        WorkerPool.prototype._execute = function (workerInfo, action) {
            var _this = this;
            workerInfo.active = true;
            action(workerInfo.worker, function () {
                workerInfo.active = false;
                var nextAction = _this._pendingActions.shift();
                if (nextAction) {
                    _this._execute(workerInfo, nextAction);
                }
            });
        };
        return WorkerPool;
    }());
    LIB.WorkerPool = WorkerPool;
})(LIB || (LIB = {}));

//# sourceMappingURL=LIB.workerPool.js.map
//# sourceMappingURL=LIB.workerPool.js.map

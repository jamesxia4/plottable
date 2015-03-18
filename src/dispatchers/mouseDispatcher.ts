///<reference path="../reference.ts" />

module Plottable {
export module Dispatcher {
  export type MouseCallback = (p: Point, e: MouseEvent) => any;
  export type WheelCallback = (p: Point, deltaY: number, e: MouseEvent) => any;

  export class Mouse extends AbstractDispatcher {
    private static _DISPATCHER_KEY = "__Plottable_Dispatcher_Mouse";
    private translator: _Util.ClientToSVGTranslator;
    private _lastMousePosition: Point;
    private _moveBroadcaster: Core.Broadcaster<Dispatcher.Mouse>;
    private _downBroadcaster: Core.Broadcaster<Dispatcher.Mouse>;
    private _upBroadcaster: Core.Broadcaster<Dispatcher.Mouse>;
    private _wheelBroadcaster: Core.Broadcaster<Dispatcher.Mouse>;
    private _processMoveCallback: (e: MouseEvent) => any;
    private _processDownCallback: (e: MouseEvent) => any;
    private _processUpCallback: (e: MouseEvent) => any;
    private _processWheelCallback: (e: WheelEvent) => any;

    /**
     * Get a Dispatcher.Mouse for the <svg> containing elem. If one already exists
     * on that <svg>, it will be returned; otherwise, a new one will be created.
     *
     * @param {SVGElement} elem A svg DOM element.
     * @return {Dispatcher.Mouse} A Dispatcher.Mouse
     */
    public static getDispatcher(elem: SVGElement): Dispatcher.Mouse {
      var svg = _Util.DOM.getBoundingSVG(elem);

      var dispatcher: Mouse = (<any> svg)[Mouse._DISPATCHER_KEY];
      if (dispatcher == null) {
        dispatcher = new Mouse(svg);
        (<any> svg)[Mouse._DISPATCHER_KEY] = dispatcher;
      }
      return dispatcher;
    }

    /**
     * Creates a Dispatcher.Mouse.
     * This constructor not be invoked directly under most circumstances.
     *
     * @param {SVGElement} svg The root <svg> element to attach to.
     */
    constructor(svg: SVGElement) {
      super();

      this.translator = _Util.ClientToSVGTranslator.getTranslator(svg);

      this._lastMousePosition = { x: -1, y: -1 };
      this._moveBroadcaster = new Core.Broadcaster(this);

      this._processMoveCallback = (e: MouseEvent) => this._measureAndBroadcast(e, this._moveBroadcaster);
      this._event2Callback["mouseover"] = this._processMoveCallback;
      this._event2Callback["mousemove"] = this._processMoveCallback;
      this._event2Callback["mouseout"] = this._processMoveCallback;

      this._downBroadcaster = new Core.Broadcaster(this);
      this._processDownCallback = (e: MouseEvent) => this._measureAndBroadcast(e, this._downBroadcaster);
      this._event2Callback["mousedown"] = this._processDownCallback;

      this._upBroadcaster = new Core.Broadcaster(this);
      this._processUpCallback = (e: MouseEvent) => this._measureAndBroadcast(e, this._upBroadcaster);
      this._event2Callback["mouseup"] = this._processUpCallback;

      this._wheelBroadcaster = new Core.Broadcaster(this);
      this._processWheelCallback = (e: WheelEvent) => this._measureAndBroadcast(e, this._wheelBroadcaster, [e.deltaY]);
      this._event2Callback["wheel"] = this._processWheelCallback;

      this._broadcasters = [this._moveBroadcaster, this._downBroadcaster, this._upBroadcaster, this._wheelBroadcaster];
    }

    protected _getWrappedCallback(callback: Function): Core.BroadcasterCallback<Dispatcher.Mouse> {
      return (md: Dispatcher.Mouse, p: Point, e: MouseEvent) => callback(p, e);
    }

    /**
     * Registers a callback to be called whenever the mouse position changes,
     * or removes the callback if `null` is passed as the callback.
     *
     * @param {any} key The key associated with the callback.
     *                  Key uniqueness is determined by deep equality.
     * @param {(p: Point) => any} callback A callback that takes the pixel position
     *                                     in svg-coordinate-space. Pass `null`
     *                                     to remove a callback.
     * @return {Dispatcher.Mouse} The calling Dispatcher.Mouse.
     */
    public onMouseMove(key: any, callback: MouseCallback): Dispatcher.Mouse {
      this._setCallback(this._moveBroadcaster, key, callback);
      return this;
    }

    /**
     * Registers a callback to be called whenever a mousedown occurs,
     * or removes the callback if `null` is passed as the callback.
     *
     * @param {any} key The key associated with the callback.
     *                  Key uniqueness is determined by deep equality.
     * @param {(p: Point) => any} callback A callback that takes the pixel position
     *                                     in svg-coordinate-space. Pass `null`
     *                                     to remove a callback.
     * @return {Dispatcher.Mouse} The calling Dispatcher.Mouse.
     */
    public onMouseDown(key: any, callback: MouseCallback): Dispatcher.Mouse {
      this._setCallback(this._downBroadcaster, key, callback);
      return this;
    }

    /**
     * Registers a callback to be called whenever a mouseup occurs,
     * or removes the callback if `null` is passed as the callback.
     *
     * @param {any} key The key associated with the callback.
     *                  Key uniqueness is determined by deep equality.
     * @param {(p: Point) => any} callback A callback that takes the pixel position
     *                                     in svg-coordinate-space. Pass `null`
     *                                     to remove a callback.
     * @return {Dispatcher.Mouse} The calling Dispatcher.Mouse.
     */
    public onMouseUp(key: any, callback: MouseCallback): Dispatcher.Mouse {
      this._setCallback(this._upBroadcaster, key, callback);
      return this;
    }

    /**
     * Registers a callback to be called whenever a mouseup occurs,
     * or removes the callback if `null` is passed as the callback.
     *
     * @param {any} key The key associated with the callback.
     *                  Key uniqueness is determined by deep equality.
     * @param {(p: Point) => any} callback A callback that takes the pixel position
     *                                     in svg-coordinate-space. Pass `null`
     *                                     to remove a callback.
     * @return {Dispatcher.Mouse} The calling Dispatcher.Mouse.
     */
    public onWheel(key: any, callback: MouseCallback): Dispatcher.Mouse {
      this._setCallback(this._upBroadcaster, key, callback);
      return this;
    }

    /**
     * Computes the mouse position from the given event, and if successful
     * calls broadcast() on the supplied Broadcaster.
     */
    private _measureAndBroadcast(e: MouseEvent, b: Core.Broadcaster<Dispatcher.Mouse>,
                                 otherBroadcastData: any[] = []) {
      var newMousePosition = this.translator.computePosition(e.clientX, e.clientY);
      if (newMousePosition != null) {
        this._lastMousePosition = newMousePosition;
        var broadcastArgList = [this.getLastMousePosition()].concat(otherBroadcastData).concat(e);
        b.broadcast.apply(b, broadcastArgList);
      }
    }

    /**
     * Returns the last computed mouse position.
     *
     * @return {Point} The last known mouse position in <svg> coordinate space.
     */
    public getLastMousePosition() {
      return this._lastMousePosition;
    }
  }
}
}

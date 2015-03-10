"use strict";

// schedulers should be singletons
var Scheduler = require("./scheduler");
var SimpleScheduler = require("./simple-scheduler");
var scheduler = null;
var simpleScheduler = null;

// scheduler factory
module.exports.getScheduler = function (audioContext) {
  if (scheduler === null) {
    scheduler = new Scheduler(audioContext, {});
  }

  return scheduler;
};

module.exports.getSimpleScheduler = function (audioContext) {
  if (simpleScheduler === null) {
    simpleScheduler = new SimpleScheduler(audioContext, {});
  }

  return simpleScheduler;
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImVzNi91dGlscy9wcmlvcml0eS1xdWV1ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDdkMsSUFBSSxlQUFlLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7QUFDcEQsSUFBSSxTQUFTLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLElBQUksZUFBZSxHQUFHLElBQUksQ0FBQzs7O0FBRzNCLE1BQU0sQ0FBQyxPQUFPLENBQUMsWUFBWSxHQUFHLFVBQVMsWUFBWSxFQUFFO0FBQ25ELE1BQUksU0FBUyxLQUFLLElBQUksRUFBRTtBQUN0QixhQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsWUFBWSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0dBQzdDOztBQUVELFNBQU8sU0FBUyxDQUFDO0NBQ2xCLENBQUM7O0FBRUYsTUFBTSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsR0FBRyxVQUFTLFlBQVksRUFBRTtBQUN6RCxNQUFJLGVBQWUsS0FBSyxJQUFJLEVBQUU7QUFDNUIsbUJBQWUsR0FBRyxJQUFJLGVBQWUsQ0FBQyxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDekQ7O0FBRUQsU0FBTyxlQUFlLENBQUM7Q0FDeEIsQ0FBQyIsImZpbGUiOiJlczYvdXRpbHMvcHJpb3JpdHktcXVldWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJcbi8vIHNjaGVkdWxlcnMgc2hvdWxkIGJlIHNpbmdsZXRvbnNcbnZhciBTY2hlZHVsZXIgPSByZXF1aXJlKCcuL3NjaGVkdWxlcicpO1xudmFyIFNpbXBsZVNjaGVkdWxlciA9IHJlcXVpcmUoJy4vc2ltcGxlLXNjaGVkdWxlcicpO1xudmFyIHNjaGVkdWxlciA9IG51bGw7XG52YXIgc2ltcGxlU2NoZWR1bGVyID0gbnVsbDtcblxuLy8gc2NoZWR1bGVyIGZhY3Rvcnlcbm1vZHVsZS5leHBvcnRzLmdldFNjaGVkdWxlciA9IGZ1bmN0aW9uKGF1ZGlvQ29udGV4dCkge1xuICBpZiAoc2NoZWR1bGVyID09PSBudWxsKSB7XG4gICAgc2NoZWR1bGVyID0gbmV3IFNjaGVkdWxlcihhdWRpb0NvbnRleHQsIHt9KTtcbiAgfVxuXG4gIHJldHVybiBzY2hlZHVsZXI7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5nZXRTaW1wbGVTY2hlZHVsZXIgPSBmdW5jdGlvbihhdWRpb0NvbnRleHQpIHtcbiAgaWYgKHNpbXBsZVNjaGVkdWxlciA9PT0gbnVsbCkge1xuICAgIHNpbXBsZVNjaGVkdWxlciA9IG5ldyBTaW1wbGVTY2hlZHVsZXIoYXVkaW9Db250ZXh0LCB7fSk7XG4gIH1cblxuICByZXR1cm4gc2ltcGxlU2NoZWR1bGVyO1xufTsiXX0=
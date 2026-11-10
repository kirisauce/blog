// 入场动画的起始状态：先于首帧给 <html> 打上待播标记，元素才不会
// 以最终状态闪现一次。站内换页不写回该标记，动画交给视图过渡。
document.documentElement.dataset.enter = 'pending';

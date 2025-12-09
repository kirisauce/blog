"use strict";

const js = hexo.extend.helper.get("js").bind(hexo);
const css = hexo.extend.helper.get("css").bind(hexo);

const CSS_TEXT = `<style>
.heimu-elem {
    position: relative;
}

.heimu-elem.heimu-covered::after {
    background-color: black;
}

.heimu-elem.heimu-covered:hover::after {
    background-color: #00000000;
}

.heimu-elem:after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: #00000000;
    pointer-events: none;
    left: 0;
    top: 0;
    transition: background-color linear 0.15s;
}
</style>`;

hexo.extend.injector.register("head_begin", CSS_TEXT);

hexo.extend.tag.register("heimu", (args) => {
    console.error(args);
    console.error(hexo.config.heimu);
    const txt = args[0];
    return `<span title="你知道的太多了" class="heimu-elem heimu-covered" onclick="this.classList.toggle('heimu-covered')">${txt}</span>`;
})
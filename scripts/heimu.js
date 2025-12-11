"use strict";

function candidates(items) {
    for (item of items) {
        if (item !== null && item !== undefined) {
            return item;
        }
    }
}

function parse_args(args) {
    // 遇到'--'或第一个内容文本表示后面都是内容文本
    let is_options_end = false;
    let content_text = "";
    const options = {};

    for (let idx = 0; idx < args.length; idx += 1) {
        let opt = args[idx];

        if (!is_options_end) {
            if (opt.length == 0) {
                continue;
            }
            if (opt.startsWith("--")) {
                let optname = opt.slice(2);
                if (optname == "") {
                    is_options_end = true;
                    continue;
                } else {
                    idx += 1;
                    options[optname] = args[idx];
                }
            } else {
                is_options_end = true;
            }
        }

        if (is_options_end) {
            if (content_text.length > 0) {
                content_text += " ";
            }
            content_text += opt;
        }
    }

    options._content = content_text;
    return options;
}

const js = hexo.extend.helper.get("js").bind(hexo);
const css = hexo.extend.helper.get("css").bind(hexo);

const CSS_TEXT = `<style>
.heimu-elem {
    background-color: black;
    color: #ffffff00;
}

.heimu-elem.heimu-uncovered {
    color: #ffffffff;
}

.heimu-elem:hover {
    color: #ffffffff;
}

.heimu-elem {
    transition: color linear 0.15s;
}
</style>`;

hexo.extend.injector.register("head_begin", CSS_TEXT);

hexo.extend.tag.register("heimu", function(args) {
    let options = {
        title: "你知道的太多了",
    };
    Object.assign(options, hexo.config.heimu, hexo.theme.heimu, this.heimu, parse_args(args));

    return `<span title="${options.title}" class="heimu-elem">${options._content}</span>`;
})
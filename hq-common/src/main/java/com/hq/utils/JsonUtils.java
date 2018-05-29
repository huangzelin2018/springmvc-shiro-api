package com.hq.utils;

import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import net.sf.json.JsonConfig;
import net.sf.json.processors.JsonValueProcessor;
import net.sf.json.util.PropertyFilter;

import java.lang.reflect.Field;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.*;

import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * json工具类，可以过滤不必要属性
 * include(object,"字段1,字段2...")
 * filter(list,"字段1,字段2...");
 */
public class JsonUtils {

    public static String include(Object object, String fields) {
        String[] filterFields = fields.split(",");
        return jsonApi(object, filterFields, false, DateUtils.DATE_TIME_PATTERN);
    }

    public static String filter(Object object, String fields) {
        String[] filterFields = fields.split(",");
        return jsonApi(object, filterFields, true, DateUtils.DATE_TIME_PATTERN);
    }

    public static String jsonApi(Object object, String[] filterFields, boolean isFitler, String dateFormat) {
        JsonConfig config = new JsonConfig();
        config.registerJsonValueProcessor(Date.class, new JsonDateValueProcessor(dateFormat));
        config.setJsonPropertyFilter(new IgnoreFieldProcessor(isFitler, filterFields)); // 忽略掉name属性及集合对象
        String jsonString = null;
        if (object instanceof List) {
            JSONArray jsonArray = JSONArray.fromObject(object, config);
            jsonString = jsonArray.toString();
        } else {
            JSONObject fromObject = JSONObject.fromObject(object, config);
            jsonString = fromObject.toString();
        }
        return jsonString;
    }

}

class JsonDateValueProcessor implements JsonValueProcessor {

    private DateFormat dateFormat;

    public JsonDateValueProcessor() {
        dateFormat = new SimpleDateFormat(DateUtils.DATE_TIME_PATTERN);
    }

    public JsonDateValueProcessor(String datePattern) {
        dateFormat = new SimpleDateFormat(datePattern);
    }

    public Object processArrayValue(Object value, JsonConfig jsonConfig) {
        return process(value);
    }

    public Object processObjectValue(String key, Object value, JsonConfig jsonConfig) {
        return process(value);
    }

    private Object process(Object value) {
        if (value == null) {
            return "";
        }
        return dateFormat.format((Date) value);
    }
}

/**
 * <p>Title: 忽略属性</p>
 * <p>Description：忽略JAVABEAN的指定属性、是否忽略集合类属性</p>
 */
class IgnoreFieldProcessor implements PropertyFilter {

    Log log = LogFactory.getLog(this.getClass());
    /**
     * 忽略的属性名称
     */
    private String[] fields;

    /**
     * 是否过滤属性
     */
    private boolean isFilter = true;

    public String[] getFields() {
        return fields;
    }

    /**
     * 设置忽略的属性
     *
     * @param fields
     */
    public void setFields(String[] fields) {
        this.fields = fields;
    }

    public boolean isFilter() {
        return isFilter;
    }

    public void setFilter(boolean filter) {
        isFilter = filter;
    }

    /**
     * 空参构造方法<br/>
     * 默认不忽略集合
     */
    public IgnoreFieldProcessor() {
        // empty
    }

    /**
     * 构造方法
     *
     * @param fields 忽略属性名称数组
     */
    public IgnoreFieldProcessor(String[] fields) {
        this.fields = fields;
    }

    /**
     * 构造方法
     *
     * @param isFilter 是否忽略属性
     * @param fields   忽略属性名称数组
     */
    public IgnoreFieldProcessor(boolean isFilter, String[] fields) {
        this.fields = fields;
        this.isFilter = isFilter;
    }


    public boolean apply(Object source, String name, Object value) {
        if (fields != null && fields.length > 0) {
            return isFilter ? filter(fields, name) : include(fields, name);
        }
        return false;
    }

    /**
     * 过滤忽略的属性
     */
    public boolean filter(String[] s, String s2) {
        for (String sl : s) {
            if (s2.equals(sl)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 包含属性
     */
    public boolean include(String[] s, String s2) {
        for (String sl : s) {
            if (s2.equals(sl)) {
                return false;
            }
        }
        return true;
    }


}
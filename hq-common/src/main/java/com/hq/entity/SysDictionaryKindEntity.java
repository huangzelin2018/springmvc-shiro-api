package com.hq.entity;

import java.io.Serializable;
import java.util.Date;



/**
 * 
 * 
 * @author chenshun
 * @email sunlightcs@gmail.com
 * @date 2017-06-20 17:42:22
 */
public class SysDictionaryKindEntity implements Serializable {
	private static final long serialVersionUID = 1L;
	
	//主键
	private Long id;
	//字典项
	private String kind;
	//字典注释
	private String comments;

	/**
	 * 设置：主键
	 */
	public void setId(Long id) {
		this.id = id;
	}
	/**
	 * 获取：主键
	 */
	public Long getId() {
		return id;
	}
	/**
	 * 设置：字典项
	 */
	public void setKind(String kind) {
		this.kind = kind;
	}
	/**
	 * 获取：字典项
	 */
	public String getKind() {
		return kind;
	}
	/**
	 * 设置：字典注释
	 */
	public void setComments(String comments) {
		this.comments = comments;
	}
	/**
	 * 获取：字典注释
	 */
	public String getComments() {
		return comments;
	}
}

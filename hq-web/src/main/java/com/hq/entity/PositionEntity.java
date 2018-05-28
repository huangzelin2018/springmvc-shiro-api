package com.hq.entity;

import com.hq.base.BaseEntity;

import java.io.Serializable;
import java.util.Date;



/**
 * 诚聘英才-岗位信息表
 * 
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2018-05-21 14:01:11
 */
public class PositionEntity extends BaseEntity {
	private static final long serialVersionUID = 1L;
	//职位标题
	private String jobTitle;
	//职位要求年限
	private String jobYear;
	//学历
	private String education;
	//职位分类编号
	private Long jobTypeId;
	//职位招聘人数
	private Integer jobCount;
	//岗位职责
	private String jobDescription;
	//任职资格
	private String jobCondition;
	//联系方式
	private String contact;
	//工作地址
	private String address;

	/**
	 * 设置：职位标题
	 */
	public void setJobTitle(String jobTitle) {
		this.jobTitle = jobTitle;
	}
	/**
	 * 获取：职位标题
	 */
	public String getJobTitle() {
		return jobTitle;
	}
	/**
	 * 设置：职位要求年限
	 */
	public void setJobYear(String jobYear) {
		this.jobYear = jobYear;
	}
	/**
	 * 获取：职位要求年限
	 */
	public String getJobYear() {
		return jobYear;
	}
	/**
	 * 设置：学历
	 */
	public void setEducation(String education) {
		this.education = education;
	}
	/**
	 * 获取：学历
	 */
	public String getEducation() {
		return education;
	}
	/**
	 * 设置：职位分类编号
	 */
	public void setJobTypeId(Long jobTypeId) {
		this.jobTypeId = jobTypeId;
	}
	/**
	 * 获取：职位分类编号
	 */
	public Long getJobTypeId() {
		return jobTypeId;
	}
	/**
	 * 设置：职位招聘人数
	 */
	public void setJobCount(Integer jobCount) {
		this.jobCount = jobCount;
	}
	/**
	 * 获取：职位招聘人数
	 */
	public Integer getJobCount() {
		return jobCount;
	}
	/**
	 * 设置：岗位职责
	 */
	public void setJobDescription(String jobDescription) {
		this.jobDescription = jobDescription;
	}
	/**
	 * 获取：岗位职责
	 */
	public String getJobDescription() {
		return jobDescription;
	}
	/**
	 * 设置：任职资格
	 */
	public void setJobCondition(String jobCondition) {
		this.jobCondition = jobCondition;
	}
	/**
	 * 获取：任职资格
	 */
	public String getJobCondition() {
		return jobCondition;
	}
	/**
	 * 设置：联系方式
	 */
	public void setContact(String contact) {
		this.contact = contact;
	}
	/**
	 * 获取：联系方式
	 */
	public String getContact() {
		return contact;
	}
	/**
	 * 设置：工作地址
	 */
	public void setAddress(String address) {
		this.address = address;
	}
	/**
	 * 获取：工作地址
	 */
	public String getAddress() {
		return address;
	}


}

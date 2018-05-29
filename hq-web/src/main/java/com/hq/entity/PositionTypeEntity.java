package com.hq.entity;

import com.hq.base.BaseEntity;
import com.hq.validator.group.AddGroup;
import com.hq.validator.group.UpdateGroup;
import org.hibernate.validator.constraints.NotBlank;

import java.io.Serializable;
import java.util.Date;



/**
 * 职位类别管理
 *
 * @author linyuebin
 * @email trust_100@163.com
 * @date 2018-05-29 00:51:22
 */
public class PositionTypeEntity extends BaseEntity {
	private static final long serialVersionUID = 1L;

	//职位分类名称
	@NotBlank(message="职位分类名称不能为空", groups = {AddGroup.class, UpdateGroup.class})
	private String jobTypeName;
	//类别小图
	private String jobTypePic;

	/**
	 * 设置：职位分类名称
	 */
	public void setJobTypeName(String jobTypeName) {
		this.jobTypeName = jobTypeName;
	}
	/**
	 * 获取：职位分类名称
	 */
	public String getJobTypeName() {
		return jobTypeName;
	}
	/**
	 * 设置：类别小图
	 */
	public void setJobTypePic(String jobTypePic) {
		this.jobTypePic = jobTypePic;
	}
	/**
	 * 获取：类别小图
	 */
	public String getJobTypePic() {
		return jobTypePic;
	}
}
